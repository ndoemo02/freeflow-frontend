import { LLMContract } from './llmContract';

// Typy pomocnicze dla funkcji sterujących UI (zostaną zaimplementowane w konkretnych komponentach)
export interface UIController {
    stopAllTTS: () => void;
    playTTS: (text: string) => Promise<void>;

    clearHighlights: () => void;
    highlightCard: (cardId: string) => void;
    unhighlightCard: (cardId: string) => void;
    scrollToCard: (cardId: string) => void;

    lockUserInput: () => void;
    unlockUserInput: () => void;
    openMicrophone: () => void;

    // Funkcje montujące widoki - w React mogą to być settery stanu
    setUIMode: (mode: LLMContract['ui_mode']) => void;
}

// Globalny lock chroniący przed re-entrancy
let isRendering = false;

// Flaga aborcji - pozwala na przerwanie pętli renderowania
let abort = false;

export function abortRender() {
    console.log("🛑 [RenderFromLLM] Abort requested");
    abort = true;
}

/**
 * SERCE PREZENTACJI GŁOSOWEJ.
 * 
 * Ta funkcja jest całkowicie deterministyczna.
 * Nie podejmuje decyzji - tylko wykonuje instrukcje z kontraktu.
 * Wykonywana jest liniowo (await za await), aby uniknąć race conditions.
 */
export async function renderFromLLM(contract: LLMContract, ui: UIController) {
    // (A) Guard: Re-entrancy Lock
    if (isRendering) {
        console.warn("⚠️ [RenderFromLLM] Already running — request ignored");
        return;
    }

    isRendering = true;
    abort = false; // Reset aborcji na starcie

    // (C) Debug Trace
    if (process.env.NODE_ENV !== 'production') {
        console.group("🎬 renderFromLLM");
        console.log("ui_mode:", contract.ui_mode);
        console.log("steps:", contract.presentation_sequence?.length || 0);
        console.log("expect_selection:", contract.expect_selection);
        console.groupEnd();
    }

    try {
        // 1. HARD RESET UI STATE
        // Czyścimy wszystko, aby nie nałożyć prezentacji na poprzedni stan
        ui.stopAllTTS();
        ui.clearHighlights();
        ui.lockUserInput(); // Blokujemy interakcję podczas prezentacji (opcjonalne, ale zalecane)

        if (abort) return;

        // 2. SWITCH TYLKO PO ui_mode
        // Decydujemy, co wyświetlić. To ustawia "scenę".
        switch (contract.ui_mode) {
            case 'idle':
            case 'standard_chat':
                ui.setUIMode('standard_chat');
                break;

            case 'restaurant_presentation':
                ui.setUIMode('restaurant_presentation');
                break;

            case 'menu_presentation':
                ui.setUIMode('menu_presentation');
                break;

            case 'cart_summary':
                ui.setUIMode('cart_summary');
                break;

            case 'confirmation':
                ui.setUIMode('confirmation');
                break;

            default:
                // (B) Hard Fail na nieznany ui_mode
                throw new Error(`Unsupported ui_mode: ${(contract as any).ui_mode}`);
        }

        if (abort) return;

        // 3. VOICE INTRO (Blokujące)
        // Asystent wprowadza w temat. Nic się jeszcze nie dzieje na ekranie (poza zmianą widoku).
        if (contract.voice_intro) {
            await ui.playTTS(contract.voice_intro);
        }

        if (abort) return;

        // 4. SEKWENCJA PREZENTACJI (Deterministyczna pętla)
        // Iterujemy po krokach. Każdy krok to: Fokus -> Scroll -> Głos -> Defokus
        if (contract.presentation_sequence && contract.presentation_sequence.length > 0) {

            // (C) Logic Assertion: Sekwencja powinna być ignorowana, jeśli to tylko pytanie kończące (co nie powinno mieć miejsca, jeśli LLM jest poprawny, ale dla bezpieczeństwa)
            // W obecnym modelu, jeśli mamy sekwencję, to ją odtwarzamy, a potem pytanie.

            for (const step of contract.presentation_sequence) {
                if (abort) break;

                // A. Wskazujemy palcem (Highlight + Scroll)
                ui.scrollToCard(step.card_id);
                ui.highlightCard(step.card_id);

                // B. Opowiadamy o tym elemencie (Blokujące - czekamy aż skończy)
                if (step.tts_narrative) {
                    await ui.playTTS(step.tts_narrative);
                }

                // C. Zdejmujemy wyróżnienie
                ui.unhighlightCard(step.card_id);
            }
        }

        if (abort) return;

        // 5. CLOSING QUESTION (Stop generowania)
        // Asystent zadaje pytanie końcowe. To jest sygnał "Twoja kolej".
        if (contract.closing_question) {
            await ui.playTTS(contract.closing_question);
            // (C) Zapewnienie logiczne: Po pytaniu nie ma już generowania.
        }

        if (abort) return;

        // 6. STEROWANIE MIKROFONEM (Koniec)
        // Decydujemy, czy oddać głos użytkownikowi automatycznie.

        if (contract.expect_selection) {
            ui.unlockUserInput(); // Odblokuj tuż przed otwarciem mica
            ui.openMicrophone();
        } else {
            ui.unlockUserInput();
        }

    } catch (error) {
        if (abort) {
            console.log("🛑 [RenderFromLLM] Aborted during execution");
        } else {
            console.error("❌ [RenderFromLLM] Critical Error:", error);
        }
        ui.unlockUserInput(); // Safety unlock on crash
    } finally {
        isRendering = false;
        abort = false; // Reset flagi po zakończeniu
        console.log("🏁 [RenderFromLLM] Finished");
    }
}
