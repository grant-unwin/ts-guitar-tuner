import { useState } from "react";

export enum NoteAccuracy {
    Unknown = 'unknown',
    Perfect = "perfect",
    Flat = "flat",
    Sharp = "sharp",
}

export enum NoteConfidence {
    Vague = 'vague',
    Confident = 'confident',
}

export enum Notes {
    None = '-',
    C = 'C',
    CSharp = 'C#',
    D = 'D',
    DSharp = 'D#',
    E = 'E',
    F = 'F',
    FSharp = 'F#',
    G = 'G',
    GSharp = 'G#',
    A = 'A',
    ASharp = 'A#',
    B = 'B',
}

export const useAudioTuner = (tolerance: number = 4) => {

    const [noteAccuracy, setNoteAccurancy] = useState<NoteAccuracy>(NoteAccuracy.Unknown);
    const [detuneAmount, setDetuneAmount] = useState<number>(0);
    const [confidence, setConfidence] = useState<NoteConfidence>(NoteConfidence.Vague);
    const [pitch, setPitch] = useState<number>(0);
    const [note, setNote] = useState<Notes>(Notes.None);

    var audioContext: any = null;
    var analyser: any = null;
    var mediaStreamSource = null;

    var rafID: number | null = null;
    var buflen = 2048;
    var buf = new Float32Array(buflen);

    var noteStrings = [
        Notes.C,
        Notes.CSharp,
        Notes.D,
        Notes.DSharp,
        Notes.E,
        Notes.F,
        Notes.FSharp,
        Notes.G,
        Notes.GSharp,
        Notes.A,
        Notes.ASharp,
        Notes.B,
    ]

    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    const error = console.error


    const noteFromPitch = (frequency: number) => {
        var noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
        return Math.round(noteNum) + 69;
    }

    const frequencyFromNoteNumber = (note: number) => {
        return 440 * Math.pow(2, (note - 69) / 12);
    }

    const centsOffFromPitch = (frequency: number, note: number) => {
        const perc = Math.floor(1200 * Math.log(frequency / frequencyFromNoteNumber(note)) / Math.log(2));
        console.log(perc);
        return perc
    }

    const autoCorrelate = (buf: Float32Array, sampleRate: number) => {
        // Implements the ACF2+ algorithm
        var SIZE = buf.length;
        var rms = 0;

        for (let i = 0; i < SIZE; i++) {
            var val = buf[i];
            rms += val * val;
        }
        rms = Math.sqrt(rms / SIZE);
        if (rms < 0.01) // not enough signal
            return -1;

        var r1 = 0, r2 = SIZE - 1, thres = 0.2;
        for (let i = 0; i < SIZE / 2; i++) {
            if (Math.abs(buf[i]) < thres) { r1 = i; break; }
        }
        for (let i = 1; i < SIZE / 2; i++) {
            if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
        }

        buf = buf.slice(r1, r2);
        SIZE = buf.length;

        var c = new Array(SIZE).fill(0);
        for (let i = 0; i < SIZE; i++)
            for (let j = 0; j < SIZE - i; j++)
                c[i] = c[i] + buf[j] * buf[j + i];

        var d = 0; while (c[d] > c[d + 1]) d++;
        var maxval = -1, maxpos = -1;
        for (let i = d; i < SIZE; i++) {
            if (c[i] > maxval) {
                maxval = c[i];
                maxpos = i;
            }
        }
        var T0 = maxpos;

        var x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
        const a = (x1 + x3 - 2 * x2) / 2;
        const b = (x3 - x1) / 2;
        if (a) T0 = T0 - b / (2 * a);

        return sampleRate / T0;
    }


    const getUserMedia = (dictionary: any, callback: (stream: any) => void) => {

        try {
            navigator.getUserMedia =
                navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia;
            navigator.getUserMedia(dictionary, callback, error);
        } catch (e) {
            console.error('getUserMedia threw exception :' + e);
        }
    }

    const toggleLiveINput = () => {
        audioContext = new AudioContext();
            //stop playing and return
            analyser = null;
            if (!window.cancelAnimationFrame)
                window.cancelAnimationFrame = window.webkitCancelAnimationFrame;
            window.cancelAnimationFrame(rafID as number);
        getUserMedia(
            {
                "audio": {
                    "mandatory": {
                        "googEchoCancellation": "false",
                        "googAutoGainControl": "false",
                        "googNoiseSuppression": "false",
                        "googHighpassFilter": "false"
                    },
                    "optional": []
                },
            }, gotStream);
    }

    const updatePitch = () => {
        analyser.getFloatTimeDomainData(buf);
        var ac = autoCorrelate(buf, audioContext.sampleRate);

        if (ac === -1) {
            setNoteAccurancy(NoteAccuracy.Unknown)
            setConfidence(NoteConfidence.Vague)
            setDetuneAmount(0)
            setPitch(0);
            setNote(Notes.None);

        } else {
            setConfidence(NoteConfidence.Confident)
            let pitch = ac;
            setPitch(Math.round(pitch));
            var note = noteFromPitch(pitch);

            setNote(noteStrings[note % 12]);

            var detune = centsOffFromPitch(pitch, note);
            if (detune/tolerance < 1) {
                setNoteAccurancy(NoteAccuracy.Perfect)
            } else {
                if (detune < 0) {
                    setNoteAccurancy(NoteAccuracy.Flat)
                }
                else {
                    setNoteAccurancy(NoteAccuracy.Sharp)
                }
                setDetuneAmount(Math.abs(detune))
            }
        }

        if (!window.requestAnimationFrame)
            window.requestAnimationFrame = window.webkitRequestAnimationFrame;
        rafID = window.requestAnimationFrame(updatePitch);
    }


    const gotStream = (stream: any) => {

        // Create an AudioNode from the stream.
        mediaStreamSource = audioContext.createMediaStreamSource(stream);

        // Connect it to the destination.
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        mediaStreamSource.connect(analyser);
        updatePitch();
    }

    return {
        start: toggleLiveINput,
        noteAccuracy: noteAccuracy,
        detuneAmount: detuneAmount,
        confidence: confidence,
        pitch: pitch,
        note: note,
    };

}