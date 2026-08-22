const RECOGNIZABLE_SECRETS: Array<[string, RegExp]> = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/u],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/u],
  ["GitHub token", /\bgh[opusr]_[A-Za-z0-9]{20,}\b/u],
  ["GitHub fine-grained token", /\bgithub_pat_[A-Za-z0-9_]{20,}\b/u],
  ["npm token", /\bnpm_[A-Za-z0-9]{20,}\b/u],
  ["OpenAI-style key", /\bsk-[A-Za-z0-9_-]{20,}\b/u],
  ["Slack token", /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/u],
  ["JSON Web Token", /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{10,}\b/u],
  ["credential-bearing connection URL", /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|amqps?):\/\/[^/\s:@]+:[^@\s/]+@/iu],
];

export function detectRecognizableSecret(content: string): string | undefined {
  return RECOGNIZABLE_SECRETS.find(([, pattern]) => pattern.test(content))?.[0];
}
