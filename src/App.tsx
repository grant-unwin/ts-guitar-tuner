import React, { useEffect } from 'react';
import './App.css';
import { NoteAccuracy, NoteConfidence, Notes, useAudioTuner } from './hooks/useAudio';
import _debounce from 'lodash/debounce';

const App = () => {

  const {
    start,
    noteAccuracy,
    detuneAmount,
    confidence,
    pitch,
    note,
  } = useAudioTuner();


  const detuneIndicator = (delta: number, value: number) => (<span className={`indicator ${delta > value ? 'on' : 'off'}`}></span>)

  const [notesHit, setNotesHit] = React.useState<Notes[]>([]);

  useEffect(() => {
    const isConfident = confidence === NoteConfidence.Confident;
    //const isRightNote = note === Notes.G;
    const isAccurate = noteAccuracy === NoteAccuracy.Perfect;

    if (isConfident && isAccurate) {
      setNotesHit([...notesHit, note]);
    }
  }, [confidence, note, noteAccuracy, notesHit, pitch])


  return (
    <div className="App">
      <button onClick={() => start()} >START</button>

      <div className='indicator-block'>
        {detuneIndicator(noteAccuracy === NoteAccuracy.Sharp ? detuneAmount : 0, 40)}
        {detuneIndicator(noteAccuracy === NoteAccuracy.Sharp ? detuneAmount : 0, 30)}
        {detuneIndicator(noteAccuracy === NoteAccuracy.Sharp ? detuneAmount : 0, 20)}
        {detuneIndicator(noteAccuracy === NoteAccuracy.Sharp ? detuneAmount : 0, 10)}
      </div>

      <div className='note'>
        {note}
      </div>
      <div className='noteAccuracy'>
        {noteAccuracy}
      </div>

      <div className='indicator-block'>
        {detuneIndicator(noteAccuracy === NoteAccuracy.Flat ? detuneAmount : 0, 10)}
        {detuneIndicator(noteAccuracy === NoteAccuracy.Flat ? detuneAmount : 0, 20)}
        {detuneIndicator(noteAccuracy === NoteAccuracy.Flat ? detuneAmount : 0, 30)}
        {detuneIndicator(noteAccuracy === NoteAccuracy.Flat ? detuneAmount : 0, 40)}
      </div>

      <div>
        <p>Detune Amount: {detuneAmount}</p>
        <p>Confidence: {confidence}</p>
        <p>Pitch: {pitch}</p>
      </div>

      <div className='targets'>
        {Object.keys(Notes).map((key: string) => {
          // @ts-ignore
          const note = Notes[key] as Notes;

          return <div key={key} className={`note-target ${notesHit.includes(note) ? 'hit' : ''}`}>{key}</div>
        })}
      </div>

    </div>
  )
}

export default App;
