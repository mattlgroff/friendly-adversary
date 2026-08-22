import { realpathSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
const ERRNO = {
    success: 0,
    access: 2,
    badDescriptor: 8,
    fault: 21,
    invalid: 28,
    io: 29,
    noEntry: 44,
    notDirectory: 54,
    overflow: 61,
    permission: 63,
    notCapable: 76,
};
const FILETYPE = {
    unknown: 0,
    blockDevice: 1,
    characterDevice: 2,
    directory: 3,
    regularFile: 4,
    socketStream: 6,
    symbolicLink: 7,
};
const DIRECTORY_ENTRY_BYTES = 24;
const RIGHT_FD_READDIR = 1n << 14n;
const PREOPEN_DIRECTORY_FD = 3;
const utf8 = new TextDecoder("utf-8", { fatal: true });
function numberArgument(value) {
    return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : undefined;
}
function bigintArgument(value) {
    if (typeof value === "bigint" && value >= 0n)
        return value;
    if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0)
        return BigInt(value);
    return undefined;
}
function memoryRegion(memory, offset, length) {
    if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0)
        return undefined;
    if (offset > memory.buffer.byteLength || length > memory.buffer.byteLength - offset)
        return undefined;
    return new Uint8Array(memory.buffer, offset, length);
}
function memoryView(memory, offset, length) {
    const region = memoryRegion(memory, offset, length);
    return region ? new DataView(region.buffer, region.byteOffset, region.byteLength) : undefined;
}
function isInside(root, candidate) {
    const relative = path.relative(root, candidate);
    return relative === "" || (!path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(`..${path.sep}`));
}
function resolveGuestPath(root, parent, guestPath) {
    if (guestPath.includes("\0") || path.posix.isAbsolute(guestPath) || path.win32.isAbsolute(guestPath))
        return undefined;
    const candidate = path.resolve(parent, ...guestPath.split("/"));
    const resolved = realpathSync.native(candidate);
    return isInside(root, resolved) ? resolved : undefined;
}
function directoryDescriptor(candidate, rights) {
    const resolved = realpathSync.native(candidate);
    const metadata = statSync(resolved, { bigint: true });
    if (!metadata.isDirectory())
        return undefined;
    return { device: metadata.dev, inode: metadata.ino, path: resolved, rights };
}
function filesystemErrno(error) {
    const code = error.code;
    if (code === "EACCES")
        return ERRNO.access;
    if (code === "EPERM")
        return ERRNO.permission;
    if (code === "ENOENT")
        return ERRNO.noEntry;
    if (code === "ENOTDIR")
        return ERRNO.notDirectory;
    if (code === "EOVERFLOW")
        return ERRNO.overflow;
    return ERRNO.io;
}
function directoryEntryType(entry) {
    if (entry.isDirectory())
        return FILETYPE.directory;
    if (entry.isFile())
        return FILETYPE.regularFile;
    if (entry.isSymbolicLink())
        return FILETYPE.symbolicLink;
    if (entry.isBlockDevice())
        return FILETYPE.blockDevice;
    if (entry.isCharacterDevice())
        return FILETYPE.characterDevice;
    if (entry.isSocket())
        return FILETYPE.socketStream;
    return FILETYPE.unknown;
}
function requiredImport(imports, name) {
    const implementation = imports[name];
    if (!implementation)
        throw new Error(`Node WASI is missing required import: ${name}`);
    return implementation;
}
export function withWindowsDirectoryReads(nativeImports, repository, getMemory) {
    // Node 22's uvwasi returns ENOSYS for fd_readdir on Windows. Keep Node's
    // descriptor and confinement implementation, and replace only that missing
    // syscall while tracking the directories Node successfully opens.
    const root = realpathSync.native(repository);
    const pathOpen = requiredImport(nativeImports, "path_open");
    const fdClose = requiredImport(nativeImports, "fd_close");
    const rootDescriptor = directoryDescriptor(root, ~0n);
    if (!rootDescriptor)
        throw new Error(`WASI preopen is not a directory: ${repository}`);
    const directories = new Map([
        [PREOPEN_DIRECTORY_FD, rootDescriptor],
    ]);
    const wrapped = { ...nativeImports };
    wrapped.path_open = (...args) => {
        const result = pathOpen(...args);
        if (result !== ERRNO.success)
            return result;
        const parentFd = numberArgument(args[0]);
        const pathPointer = numberArgument(args[2]);
        const pathLength = numberArgument(args[3]);
        const rights = bigintArgument(args[5]);
        const resultPointer = numberArgument(args[8]);
        if (parentFd === undefined || pathPointer === undefined || pathLength === undefined || rights === undefined || resultPointer === undefined) {
            return result;
        }
        const memory = getMemory();
        const pathBytes = memoryRegion(memory, pathPointer, pathLength);
        const resultView = memoryView(memory, resultPointer, 4);
        if (!pathBytes || !resultView)
            return result;
        const openedFd = resultView.getUint32(0, true);
        directories.delete(openedFd);
        const parent = directories.get(parentFd);
        if (!parent)
            return result;
        try {
            const target = resolveGuestPath(root, parent.path, utf8.decode(pathBytes));
            const descriptor = target ? directoryDescriptor(target, rights) : undefined;
            if (descriptor)
                directories.set(openedFd, descriptor);
        }
        catch {
            // Node already authorized and opened the path. An untrackable directory
            // fails closed if the guest later attempts to enumerate it.
        }
        return result;
    };
    wrapped.fd_close = (...args) => {
        const result = fdClose(...args);
        const fd = numberArgument(args[0]);
        if (result === ERRNO.success && fd !== undefined)
            directories.delete(fd);
        return result;
    };
    const fdRenumber = nativeImports.fd_renumber;
    if (fdRenumber) {
        wrapped.fd_renumber = (...args) => {
            const result = fdRenumber(...args);
            const from = numberArgument(args[0]);
            const to = numberArgument(args[1]);
            if (result === ERRNO.success && from !== undefined && to !== undefined) {
                const directory = directories.get(from);
                directories.delete(from);
                directories.delete(to);
                if (directory)
                    directories.set(to, directory);
            }
            return result;
        };
    }
    wrapped.fd_readdir = (...args) => {
        const fd = numberArgument(args[0]);
        const bufferPointer = numberArgument(args[1]);
        const bufferLength = numberArgument(args[2]);
        const cookie = bigintArgument(args[3]);
        const usedPointer = numberArgument(args[4]);
        if (fd === undefined || bufferPointer === undefined || bufferLength === undefined || cookie === undefined || usedPointer === undefined) {
            return ERRNO.invalid;
        }
        if (cookie > BigInt(Number.MAX_SAFE_INTEGER))
            return ERRNO.overflow;
        const memory = getMemory();
        const output = memoryRegion(memory, bufferPointer, bufferLength);
        const usedView = memoryView(memory, usedPointer, 4);
        if (!output || !usedView)
            return ERRNO.fault;
        usedView.setUint32(0, 0, true);
        const directory = directories.get(fd);
        if (!directory)
            return ERRNO.badDescriptor;
        if ((directory.rights & RIGHT_FD_READDIR) === 0n)
            return ERRNO.notCapable;
        let entries;
        try {
            const current = directoryDescriptor(directory.path, directory.rights);
            if (!current || !isInside(root, current.path) || current.device !== directory.device || current.inode !== directory.inode) {
                return ERRNO.notCapable;
            }
            entries = readdirSync(current.path, { encoding: "buffer", withFileTypes: true });
        }
        catch (error) {
            return filesystemErrno(error);
        }
        let used = 0;
        for (let index = Number(cookie); index < entries.length; index += 1) {
            const entry = entries[index];
            if (!entry)
                continue;
            const name = Buffer.isBuffer(entry.name) ? entry.name : Buffer.from(entry.name);
            if (DIRECTORY_ENTRY_BYTES > bufferLength - used) {
                usedView.setUint32(0, bufferLength, true);
                return ERRNO.success;
            }
            const header = memoryView(memory, bufferPointer + used, DIRECTORY_ENTRY_BYTES);
            if (!header)
                return ERRNO.fault;
            header.setBigUint64(0, BigInt(index + 1), true);
            header.setBigUint64(8, 0n, true);
            header.setUint32(16, name.byteLength, true);
            header.setUint8(20, directoryEntryType(entry));
            header.setUint8(21, 0);
            header.setUint8(22, 0);
            header.setUint8(23, 0);
            used += DIRECTORY_ENTRY_BYTES;
            const available = bufferLength - used;
            const copied = Math.min(name.byteLength, available);
            output.set(name.subarray(0, copied), used);
            used += copied;
            if (copied < name.byteLength) {
                usedView.setUint32(0, used, true);
                return ERRNO.success;
            }
        }
        usedView.setUint32(0, used, true);
        return ERRNO.success;
    };
    return wrapped;
}
//# sourceMappingURL=wasi-preview1-windows.js.map