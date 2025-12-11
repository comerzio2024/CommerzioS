/**
 * Dispute Disclaimer Component
 * 
 * Displays T&C text for AI Dispute Resolution system.
 * Must be shown before opening a dispute, when viewing AI proposals,
 * and when AI decision is rendered.
 */

import { AlertTriangle } from "lucide-react";

export function DisputeDisclaimer({ showCheckbox = false, onAcknowledge }: { 
  showCheckbox?: boolean;
  onAcknowledge?: (acknowledged: boolean) => void;
}) {
  return (
    <div className="border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 p-4 rounded-r-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            AI Dispute Resolution (Experimental)
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
            This is an automated, AI-driven process offered free of charge. 
            No human intervention occurs at any stage. By proceeding, you acknowledge:
          </p>
          <ul className="list-disc list-inside text-xs text-yellow-700 dark:text-yellow-300 mt-2 space-y-1">
            <li>Decisions are binding and final within this platform.</li>
            <li>Commerzio SA accepts no liability for AI decisions.</li>
            <li>You may opt for external resolution at any time (fees apply).</li>
            <li>All interactions are logged for transparency and audit purposes.</li>
          </ul>
          
          {showCheckbox && onAcknowledge && (
            <label className="flex items-center gap-2 mt-3 cursor-pointer">
              <input 
                type="checkbox" 
                onChange={(e) => onAcknowledge(e.target.checked)}
                className="w-4 h-4 rounded border-yellow-400 text-yellow-600 focus:ring-yellow-500"
              />
              <span className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                I have read and accept the AI Dispute Resolution terms
              </span>
            </label>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version for inline use
 */
export function DisputeDisclaimerCompact() {
  return (
    <p className="text-xs text-muted-foreground italic">
      <AlertTriangle className="h-3 w-3 inline-block mr-1" />
      AI decisions are final and binding. No human review is available.{" "}
      <a href="/terms#dispute-resolution" className="underline hover:text-foreground">
        Learn more
      </a>
    </p>
  );
}
