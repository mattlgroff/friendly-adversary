export function reviewReceiptMarkdown(receipt) {
    const gaps = receipt.incompleteReasons.length
        ? receipt.incompleteReasons.map((reason) => `  - ${reason.replace(/\s+/gu, " ").trim()}`).join("\n")
        : "  - none";
    return `# Friendly Adversary run receipt\n\n- Run: \`${receipt.runId}\`\n- Status: ${receipt.status}\n- Repository: \`${receipt.repositoryRoot}\`\n- Base: \`${receipt.git.baseRef}\` at \`${receipt.git.baseSha}\`\n- Head: \`${receipt.git.headSha}\`\n- Diff hash: \`${receipt.git.diffHash}\`\n- Changed files: ${receipt.changedFileCount}\n- Expected lenses: ${receipt.expectedLenses.join(", ")}\n- Incomplete reasons:\n${gaps}\n`;
}
//# sourceMappingURL=review-receipt.js.map