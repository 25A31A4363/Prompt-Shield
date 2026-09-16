import { PromptAnalysisResult } from '../types';

interface TriageRule {
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  risk_status: 'HIGH_RISK' | 'MEDIUM_RISK' | 'LOW_REVIEW';
  confidence: number;
  patterns: RegExp[];
  explanation: string;
  recommendation: string;
  potential_impact: string;
  investigation_steps: string;
}

const RULES: TriageRule[] = [
  {
    category: 'System Prompt Extraction',
    severity: 'CRITICAL',
    risk_status: 'HIGH_RISK',
    confidence: 0.94,
    patterns: [
      /(?:ignore|disregard|forget).*(?:previous|prior|above|initial).*(?:instruction|directive).*(?:print|output|show|reveal|repeat|echo|dump|tell|give me)/i,
      /(?:print|output|display|show|reveal|repeat|echo|dump).*(?:system prompt|system instruction|developer instruction|hidden prompt|initial prompt|core instruction|rules above)/i,
      /(?:what|tell me).*(?:are|were|is).*(?:your|the).*(?:system instructions|system prompt|initial instructions|developer guidelines)/i,
      /(?:reveal|output|print|show).*(?:secret|canary|token|password|api[_-]?key|secret[_-]?flag)/i,
      /(?:verbatim|word for word).*(?:system|instruction|prompt)/i
    ],
    explanation: 'Potential vulnerability detected: The prompt contains directives designed to force the model to exfiltrate its system prompt, confidential guidelines, or embedded security tokens.',
    recommendation: 'Enforce strict system-level prompt boundary fencing, enable canary token monitors, and employ output filtering to redact leaked system instructions.',
    potential_impact: 'Exposure of proprietary system prompts, internal business logic, database credentials, or operational policies.',
    investigation_steps: '1. Audit system prompt delimiters and fence definitions.\n2. Verify if the target model can distinguish between developer instructions and user inputs.\n3. Implement output scanner tripwires to detect instruction verbatim leakage.'
  },
  {
    category: 'Direct Prompt Injection',
    severity: 'HIGH',
    risk_status: 'HIGH_RISK',
    confidence: 0.91,
    patterns: [
      /(?:ignore|disregard|bypass|drop|cancel|override|stop following).*(?:all|prior|previous|existing).*(?:instructions|rules|guidelines|commands|restrictions)/i,
      /(?:from now on|henceforth|you must now|starting now).*(?:ignore|obey only|follow only|act as|answer as)/i,
      /(?:new instruction|override command|super user mode|developer mode enabled|sudo mode):/i,
      /(?:your new task is to|you are reprogrammed to|system override)/i
    ],
    explanation: 'Potential vulnerability detected: Direct prompt injection pattern identified attempting to override baseline system instructions and hijack execution context.',
    recommendation: 'Implement architectural instruction separation (e.g. separate System / User message channels) and use robust input guards to reject prompt override imperatives.',
    potential_impact: 'Hijacking of the conversational flow, causing the AI application to disregard security guardrails and perform unauthorized tasks.',
    investigation_steps: '1. Review how user input is concatenated into the LLM context window.\n2. Ensure modern structured chat roles (system/developer vs user) are enforced.\n3. Test the application against instruction override payloads.'
  },
  {
    category: 'Jailbreak Attempt',
    severity: 'HIGH',
    risk_status: 'HIGH_RISK',
    confidence: 0.89,
    patterns: [
      /\b(?:dan mode|do anything now|chaosgpt|jailbreak|unrestricted mode|unfiltered ai)\b/i,
      /(?:pretend|act as if|simulate).*(?:you have no (?:rules|restrictions|limits|ethics|filters|guidelines)|you are an unfiltered)/i,
      /(?:hypothetical scenario|fictional universe|creative story).*(?:where you are allowed to|without any safety|no rules apply)/i,
      /(?:always comply|never say cannot|never refuse|bypass ethical filters)/i,
      /(?:evil twin|opposite mode|unaligned assistant)/i
    ],
    explanation: 'Potential vulnerability detected: Adversarial framing or jailbreak attempt aimed at bypassing safety filters through hypothetical role-play or constraint inversion.',
    recommendation: 'Strengthen constitutional AI guardrails, apply multi-perspective intent classification, and ensure safety policies are invariant to hypothetical framing.',
    potential_impact: 'Generation of prohibited, unsafe, or harmful content in violation of safety standards.',
    investigation_steps: '1. Test target model against role-play and fictional scenario escapes.\n2. Verify that guardrail refusal behavior is consistently triggered regardless of context persona.'
  },
  {
    category: 'Tool/Agent Manipulation',
    severity: 'CRITICAL',
    risk_status: 'HIGH_RISK',
    confidence: 0.92,
    patterns: [
      /(?:execute|run|call|invoke).*(?:bash|shell|command|sql|terminal|exec|rm -rf|drop table|curl|wget)/i,
      /(?:delete|drop|truncate).*(?:database|table|file|records|users)/i,
      /(?:send|forward|exfiltrate|post).*(?:all data|emails|passwords|tokens).*(?:to http|to https|to evil|to attacker)/i,
      /(?:grant|escalate).*(?:admin|root|privileges|permissions)/i
    ],
    explanation: 'Potential vulnerability detected: Prompt contains instructions to invoke privileged system tools, shell commands, or perform destructive database operations.',
    recommendation: 'Implement human-in-the-loop approvals for sensitive tool invocations, enforce strict JSON schemas for tool arguments, and apply least privilege principles to API agents.',
    potential_impact: 'Unauthorized remote code execution, database corruption, or exfiltration of sensitive organizational assets.',
    investigation_steps: '1. Audit tool binding configurations and ensure tool parameters are sanitized.\n2. Confirm that destructive actions (SQL write/delete, shell execution) require explicit user authorization.'
  },
  {
    category: 'Context Manipulation',
    severity: 'MEDIUM',
    risk_status: 'MEDIUM_RISK',
    confidence: 0.86,
    patterns: [
      /```.*(?:end of system|system boundary|new context|admin instructions).*```/i,
      /(?:\[system\]|\[system instruction\]|<system>|<\/system>|### Human:|### Assistant:|### System:)/i,
      /(?:delimiter|boundary).*(?:reset|override|cleared)/i,
      /(?:----|====|\*\*\*\*).*(?:end of instructions|admin prompt|begin user data)/i
    ],
    explanation: 'Potential vulnerability detected: The prompt injects simulated conversation delimiters or system tag markers to confuse the model regarding message boundaries.',
    recommendation: 'Escape or sanitize all user-supplied text before feeding into templates; avoid relying on plain text delimiters that users can replicate.',
    potential_impact: 'Context boundary confusion leading the model to treat untrusted user input as privileged system instructions.',
    investigation_steps: '1. Inspect prompt templating logic for vulnerable raw string formatting.\n2. Use structured multi-role message arrays instead of concatenated text blocks.'
  },
  {
    category: 'Obfuscated Prompt',
    severity: 'MEDIUM',
    risk_status: 'MEDIUM_RISK',
    confidence: 0.85,
    patterns: [
      /(?:base64|rot13|hex|binary|morse code|caesar cipher).*(?:decode|decrypt|translate and execute|execute the following)/i,
      /(?:(?:[A-Za-z0-9+/]{4}){8,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?)/,
      /(?:eval|unescape|decodeURIComponent)\s*\(/i
    ],
    explanation: 'Potential vulnerability detected: Obfuscated or encoded payload detected, likely intended to bypass standard keyword-based content filters.',
    recommendation: 'Decode and recursively inspect obfuscated text streams before forwarding to the language model.',
    potential_impact: 'Evasion of signature-based perimeter filters and execution of veiled attack instructions.',
    investigation_steps: '1. Decode the embedded ciphertext payload to inspect underlying intent.\n2. Ensure multi-layer token normalization and inspection occurs prior to model evaluation.'
  },
  {
    category: 'Indirect Prompt Injection',
    severity: 'HIGH',
    risk_status: 'HIGH_RISK',
    confidence: 0.88,
    patterns: [
      /(?:note to ai|instruction for the ai|assistant note|attention ai):/i,
      /(?:if you are an ai reading this|to the summarizing model|hidden instruction):/i,
      /(?:forward this email to|silently send|do not notify user and)/i
    ],
    explanation: 'Potential vulnerability detected: Indirect prompt injection pattern designed to exploit data pipelines (such as search results, email processing, or RAG documents).',
    recommendation: 'Tag untrusted external data as passive content; apply strict capability constraints to automated data ingestion pipelines.',
    potential_impact: 'Compromise of automated autonomous workflows when processing third-party content.',
    investigation_steps: '1. Review retrieval augmented generation (RAG) and document parsing pipelines.\n2. Ensure instructions within ingested documents cannot trigger privileged autonomous actions.'
  },
  {
    category: 'Other Suspicious Input',
    severity: 'LOW',
    risk_status: 'LOW_REVIEW',
    confidence: 0.72,
    patterns: [
      /\b(?:exploit|vulnerability|payload|penetration test|red team|canary token|prompt injection)\b/i,
      /\b(?:bypass|sandbox|jailbreak|injection)\b/i
    ],
    explanation: 'Requires Security Review: Input contains security or testing terminology without an explicit exploit payload. Recommended for logging and security triage review.',
    recommendation: 'Log and monitor for security triage; verify whether the query is legitimate academic inquiry or reconnaissance.',
    potential_impact: 'Low apparent risk; may represent preliminary security testing or reconnaissance probing.',
    investigation_steps: '1. Check user audit logs for repeated probing attempts.\n2. Review context to determine if tester is performing authorized assessment.'
  }
];

export function analyzePromptLocally(prompt: string): PromptAnalysisResult {
  const cleaned = prompt.trim();
  if (!cleaned) {
    return {
      risk_status: 'NO_APPARENT_RISK',
      severity: 'NONE',
      risk_category: 'No Apparent Risk',
      confidence: 1.0,
      explanation: 'Input prompt is empty. No security risks identified.',
      indicators_detected: [],
      recommendation: 'Provide non-empty prompt text for security evaluation.',
      potential_impact: 'None',
      investigation_steps: 'No action required.'
    };
  }

  for (const rule of RULES) {
    const indicators: string[] = [];
    for (const pattern of rule.patterns) {
      const match = cleaned.match(pattern);
      if (match) {
        const snippet = match[0].substring(0, 60);
        if (!indicators.includes(snippet)) {
          indicators.push(snippet);
        }
      }
    }

    if (indicators.length > 0) {
      return {
        risk_status: rule.risk_status,
        severity: rule.severity,
        risk_category: rule.category,
        confidence: rule.confidence,
        explanation: rule.explanation,
        indicators_detected: indicators,
        recommendation: rule.recommendation,
        potential_impact: rule.potential_impact,
        investigation_steps: rule.investigation_steps
      };
    }
  }

  return {
    risk_status: 'NO_APPARENT_RISK',
    severity: 'NONE',
    risk_category: 'No Apparent Risk',
    confidence: 0.96,
    explanation: 'No apparent prompt injection, system prompt extraction, jailbreak framing, or delimiter manipulation patterns identified in the prompt text.',
    indicators_detected: [],
    recommendation: 'No defensive mitigation required for this input. The prompt appears consistent with standard user queries.',
    potential_impact: 'Standard operational execution; no elevated security risk detected.',
    investigation_steps: 'No security intervention needed. Standard monitoring applies.'
  };
}
