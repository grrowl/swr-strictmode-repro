import React, { useState } from 'react';
import useSWR, { SWRConfig } from 'swr';
import useSWRMutation from 'swr/mutation';

function deferred() {
  let resolve;
  const promise = new Promise(complete => { resolve = complete; });
  return { promise, resolve };
}
const initialRead = deferred();
const olderRead = deferred();
const write = deferred();
let reads = 0;
const fetcher = () => (++reads === 1 ? initialRead.promise : olderRead.promise);

function Example() {
  const [step, setStep] = useState(1);
  const { data, mutate, isValidating } = useSWR('/value', fetcher);
  const { trigger, isMutating } = useSWRMutation('/value', () => write.promise, {
    populateCache: true,
    revalidate: false
  });
  return <main>
    <h1>SWR provider replay and a late read</h1>
    <p>Cached value: <output aria-label="Cached value">{data ?? 'loading'}</output></p>
    <p>Read: {isValidating ? 'pending' : 'idle'}; write: {isMutating ? 'pending' : 'idle'}.</p>
    <ol>
      <li><button disabled={step !== 1} onClick={() => { initialRead.resolve('enabled'); setStep(2); }}>Complete initial GET</button></li>
      <li><button disabled={step !== 2} onClick={() => { void mutate(); setStep(3); }}>Start refresh GET</button></li>
      <li><button disabled={step !== 3} onClick={() => { void trigger().then(() => setStep(5)); setStep(4); }}>Start mutation</button></li>
      <li><button disabled={step !== 4} onClick={() => write.resolve('disabled')}>Complete mutation</button></li>
      <li><button disabled={step !== 5} onClick={() => { olderRead.resolve('enabled'); setStep(6); }}>Complete older GET</button></li>
    </ol>
    {step === 6 && <p role="status">Expected final value: disabled. Actual value: {data}.</p>}
    <p>The mutation completes before the older GET. Its value should remain cached.</p>
  </main>;
}
export default function App() {
  return <SWRConfig value={{ provider: () => new Map() }}><Example /></SWRConfig>;
}
