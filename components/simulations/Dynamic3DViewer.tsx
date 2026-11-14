'use client';
import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html, Box, Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';

function Stack3DScene({ onSelectComponent }: any) {
  const [stack, setStack] = useState<number[]>([10, 25, 42]);
  const [inputValue, setInputValue] = useState<number>(99);

  return (
    <>
      <Html position={[-3.2, 2.2, 0]}>
        <div className="bg-slate-900/90 text-white p-3 rounded-xl border border-slate-700 w-48 text-right" dir="rtl">
          <p className="text-xs text-cyan-400 font-bold mb-2">المكدس (LIFO)</p>
          <div className="flex gap-2">
            <button onClick={() => { if (stack.length < 5) { setStack([...stack, inputValue]); setInputValue(Math.floor(Math.random() * 90) + 10); } }} className="bg-emerald-600 px-2 py-1 rounded text-xs font-bold flex-1">Push</button>
            <button onClick={() => setStack(stack.slice(0, -1))} className="bg-rose-600 px-2 py-1 rounded text-xs font-bold flex-1">Pop</button>
          </div>
        </div>
      </Html>
      <Box args={[2.2, 0.2, 2.2]} position={[0, -2, 0]}><meshStandardMaterial color="#334155" /></Box>
      {stack.map((val, idx) => (
        <group key={idx} position={[0, -1.4 + idx * 0.85, 0]} onClick={() => onSelectComponent({ name: `عنصر [${val}]`, role: idx === stack.length - 1 ? 'قمة المكدس (TOP)' : 'عنصر مخزن' })}>
          <Box args={[1.6, 0.7, 1.6]}><meshStandardMaterial color={idx === stack.length - 1 ? '#0ea5e9' : '#6366f1'} /></Box>
          <Text position={[0, 0, 0.85]} fontSize={0.35} color="white">{val}</Text>
        </group>
      ))}
    </>
  );
}

function NetworkPacketScene({ speed, isPlaying, onSelectComponent }: any) {
  const packetRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(0);
  useFrame((_, delta) => {
    if (!isPlaying || !packetRef.current) return;
    progressRef.current = (progressRef.current + delta * 0.4 * speed) % 1;
    packetRef.current.position.x = -3.5 + progressRef.current * 7;
  });
  return (
    <>
      <Line points={[[-3.5, 0, 0], [0, 0, 0], [3.5, 0, 0]]} color="#64748b" lineWidth={3} />
      <group position={[-3.5, 0, 0]} onClick={() => onSelectComponent({ name: 'PC1', role: 'يرسل البيانات ويغلفها بعنوان IP و MAC' })}>
        <Box args={[1.1, 1.1, 1.1]}><meshStandardMaterial color="#3b82f6" /></Box>
        <Text position={[0, 1, 0]} fontSize={0.28} color="white">PC1</Text>
      </group>
      <group position={[0, 0, 0]} onClick={() => onSelectComponent({ name: 'Switch', role: 'يوجه الإطارات بناءً على عنوان MAC في الطبقة الثانية' })}>
        <Box args={[1.5, 0.5, 1.3]}><meshStandardMaterial color="#10b981" /></Box>
        <Text position={[0, 0.8, 0]} fontSize={0.28} color="white">Switch</Text>
      </group>
      <group position={[3.5, 0, 0]} onClick={() => onSelectComponent({ name: 'Router', role: 'يوجه الحزم بين الشبكات بناءً على عنوان IP في الطبقة الثالثة' })}>
        <Sphere args={[0.8, 32, 32]}><meshStandardMaterial color="#f59e0b" /></Sphere>
        <Text position={[0, 1.2, 0]} fontSize={0.28} color="white">Router</Text>
      </group>
      <Sphere ref={packetRef} args={[0.22, 16, 16]} position={[-3.5, 0.3, 0]}><meshStandardMaterial color="#ef4444" /></Sphere>
    </>
  );
}

export default function Dynamic3DViewer({ config }: { config: any }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [selectedInfo, setSelectedInfo] = useState<{ name: string; role: string } | null>(null);

  if (!config || config.mode === 'none') return null;

  return (
    <div className="my-8 rounded-2xl border border-slate-700 bg-slate-950 overflow-hidden" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 px-5 py-3 border-b border-slate-800">
        <span className="text-xs font-bold text-cyan-400">🎮 المختبر التفاعلي ثلاثي الأبعاد (انقر على العناصر)</span>
        <div className="flex gap-2">
          <button onClick={() => setIsPlaying(!isPlaying)} className="px-3 py-1.5 rounded-lg bg-cyan-600 text-xs font-bold">{isPlaying ? 'إيقاف ⏸' : 'تشغيل ▶'}</button>
          <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="bg-slate-800 text-xs rounded-lg px-2 py-1.5">
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
          </select>
        </div>
      </div>
      <div className="relative h-[380px] w-full">
        <Canvas camera={{ position: [0, 2, 7.5], fov: 50 }}>
          <ambientLight intensity={0.8} />
          <pointLight position={[10, 10, 10]} intensity={1.2} />
          <OrbitControls />
          {config.domain === 'networking' ? (
            <NetworkPacketScene speed={speed} isPlaying={isPlaying} onSelectComponent={setSelectedInfo} />
          ) : (
            <Stack3DScene onSelectComponent={setSelectedInfo} />
          )}
        </Canvas>
        {selectedInfo && (
          <div className="absolute bottom-3 right-3 bg-slate-900/95 border border-cyan-500 p-3 rounded-xl text-xs max-w-xs">
            <strong className="text-cyan-400 block mb-1">{selectedInfo.name}</strong>
            <p>{selectedInfo.role}</p>
          </div>
        )}
      </div>
    </div>
  );
}
