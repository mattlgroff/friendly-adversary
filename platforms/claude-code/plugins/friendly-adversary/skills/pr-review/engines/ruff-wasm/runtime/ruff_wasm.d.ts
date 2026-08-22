/* tslint:disable */
/* eslint-disable */

export interface Diagnostic {
    code: string | null;
    message: string;
    tags: DiagnosticTag[];
    annotations: DiagnosticAnnotation[];
    subDiagnostics: SubDiagnostic[];
    start_location: {
        row: number;
        column: number;
    };
    end_location: {
        row: number;
        column: number;
    };
    fix: {
        message: string | null;
        edits: {
            content: string | null;
            location: {
                row: number;
                column: number;
            };
            end_location: {
                row: number;
                column: number;
            };
        }[];
    } | null;
}

export type DiagnosticTag = "unnecessary" | "deprecated";

export interface DiagnosticAnnotation {
    primary: boolean;
    message: string | null;
    location: DiagnosticLocation | null;
}

export interface SubDiagnostic {
    severity: SubDiagnosticSeverity;
    message: string;
    location: DiagnosticLocation | null;
}

export enum SubDiagnosticSeverity {
    Help = "help",
    Info = "info",
    Warning = "warning",
    Error = "error",
    Fatal = "fatal",
}

export interface DiagnosticLocation {
    path: string;
    start_location: {
        row: number;
        column: number;
    };
    end_location: {
        row: number;
        column: number;
    };
}



export enum LogLevel {
    Trace = 0,
    Debug = 1,
    Info = 2,
    Warn = 3,
    Error = 4,
}

export enum PositionEncoding {
    Utf8 = 0,
    Utf16 = 1,
    Utf32 = 2,
}

export class Workspace {
    free(): void;
    [Symbol.dispose](): void;
    check(contents: string): any;
    comments(contents: string): string;
    static defaultSettings(): any;
    format(contents: string): string;
    format_ir(contents: string): string;
    constructor(options: any, position_encoding: PositionEncoding);
    /**
     * Parses the content and returns its AST
     */
    parse(contents: string): string;
    tokens(contents: string): string;
    static version(): string;
}

/**
 * Initializes the logger with the given log level.
 *
 * ## Panics
 * If this function is called more than once.
 */
export function initLogging(level: LogLevel): void;

export function run(): void;
