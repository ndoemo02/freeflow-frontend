import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import VoiceDock from "../VoiceDock";
import { useUI } from "../../state/ui";

jest.mock("../../state/ui", () => {
  const actual = jest.requireActual("../../state/ui");
  let state = { voiceState: "idle", voiceErrorMsg: undefined };
  return {
    ...actual,
    useUI: () => ({
      ...state,
      setVoiceState: (s, msg) => { state.voiceState = s; state.voiceErrorMsg = msg; },
    }),
  };
});

describe("VoiceDock", () => {
  it("renders idle state and toggles to listening", () => {
    render(<VoiceDock />);
    expect(screen.getByLabelText(/kliknij, aby mówić/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText(/słucham/i)).toBeInTheDocument();
  });

  it("shows error and retry button", () => {
    const { rerender } = render(<VoiceDock />);
    // Symuluj błąd
    useUI.getState().setVoiceState("error", "Brak uprawnień");
    rerender(<VoiceDock />);
    expect(screen.getByText(/brak uprawnień/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /spróbuj ponownie/i })).toBeInTheDocument();
  });

  it("shows speaking state", () => {
    const { rerender } = render(<VoiceDock />);
    useUI.getState().setVoiceState("speaking");
    rerender(<VoiceDock />);
    expect(screen.getByText(/mówię/i)).toBeInTheDocument();
  });
});
