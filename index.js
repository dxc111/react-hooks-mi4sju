import React, { Component, useState, useCallback, useEffect } from 'react';
import { render } from 'react-dom';
import Hello from './Hello';
import './style.css';

function MeasureExample() {
  const [height, setHeight] = useState(0);
  const [msg, setMsg] = useState([])

  const measuredRef = useCallback(node => {
    if (node !== null) {
      const resizeOb = new ResizeObserver(entries => {
        for (let entry of entries) {
          setHeight(entry.contentRect.height)
        }
      })

      resizeOb.observe(node)
    } else {
      if (resizeOb) {
        resizeOb.disconnect();
        resizeOb = null
      }
    }
  }, []);

  const handleClick = () => {
    setMsg(msg => [...msg, msg.length + 1])
  }

  return (
    <>
      <h1 ref={measuredRef}>
        {msg.map((_, i) => (<div key={i}>{i + 1}</div>))}
      </h1>
      <Counter />
      <h2>The above header is {Math.round(height)}px tall</h2>
      <button onClick={handleClick}>add</button>
    </>
  );
}

function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log(1111)
    const id = setInterval(() => {
      setCount(c => c + 1); // ✅ This doesn't depend on `count` variable outside
    }, 1000);
    return () => {clearInterval(id);console.log(2222)};
  }, []); // ✅ Our effect doesn't use any variables in the component scope

  return <h1>{count}</h1>;
}

render(<MeasureExample />, document.getElementById('root'));
