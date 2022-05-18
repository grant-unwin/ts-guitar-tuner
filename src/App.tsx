import React from 'react';
import logo from './logo.svg';
import './App.css';
import { useAudioTuner } from './hooks/useAudio';

const App = () => {

  const { 
    start,
    noteAccuracy,
    detuneAmount,
    confidence,
    pitch,
    note,
  } = useAudioTuner();

  const a = '';
  return (
    <div className="App">
      <button onClick={() => start()} >START</button>

      <div>
        <p>Note Accuracy: {noteAccuracy}</p>
        <p>Detune Amount: {detuneAmount}</p>
        <p>Confidence: {confidence}</p>
        <p>Pitch: {pitch}</p>
        <p>Note: {note}</p>
        </div>

    </div>
  )
}

export default App;
