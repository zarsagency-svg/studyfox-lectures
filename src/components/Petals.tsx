"use client";

export default function Petals() {
  return (
    <>
      {[-50, -100, -75, -150, -60, -120, -90, -140, -110, -160].map((top, i) => (
        <div key={i} className="petal" style={{ top: `${top}px`, animationDelay: `${i * 1.8}s` }} />
      ))}
    </>
  );
}
