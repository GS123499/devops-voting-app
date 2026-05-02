'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { io } from 'socket.io-client';
import { AlertCircle, BarChart3, Users, MapPin } from 'lucide-react';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export default function Dashboard() {
  const [results, setResults] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Initial fetch
    fetch(`${SOCKET_URL}/api/votes/results`)
      .then(res => res.json())
      .then(data => {
        setResults(data.results);
        setTotalVotes(data.totalVotes);
      })
      .catch(console.error);

    // Socket connection
    const socket = io(SOCKET_URL);

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('new_vote', () => {
      // Refresh data on new vote
      fetch(`${SOCKET_URL}/api/votes/results`)
        .then(res => res.json())
        .then(data => {
          setResults(data.results);
          setTotalVotes(data.totalVotes);
        });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-end pb-6 border-b border-white/10">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
            AP Election Simulator
          </h1>
          <p className="text-gray-400 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
            {connected ? 'Live Analytics Connected' : 'Connecting to simulation server...'}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 flex flex-col justify-center transition-transform hover:scale-[1.02]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
              <Users size={24} />
            </div>
            <h2 className="text-xl font-semibold">Total Simulated Votes</h2>
          </div>
          <p className="text-5xl font-bold font-mono tracking-tight">{totalVotes.toLocaleString()}</p>
        </div>

        <div className="glass-panel p-6 flex flex-col justify-center transition-transform hover:scale-[1.02]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-lg text-purple-400">
              <BarChart3 size={24} />
            </div>
            <h2 className="text-xl font-semibold">Leading Party</h2>
          </div>
          <p className="text-4xl font-bold" style={{ color: results[0]?.color || '#fff' }}>
            {results[0]?.name || 'N/A'}
          </p>
          <p className="text-gray-400 mt-2 text-sm">{results[0]?.percentage || 0}% of total votes</p>
        </div>

        <div className="glass-panel p-6 border-amber-500/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-400 shrink-0 mt-1" size={20} />
            <div>
              <h3 className="font-semibold text-amber-400 mb-1">Simulation Only</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                This platform is strictly for demonstration and technical evaluation purposes.
                Data represented here is randomly generated and does not reflect any real-world election data or voting patterns.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <MapPin size={20} className="text-gray-400" />
            Party wise results
          </h2>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={results} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="name" stroke="#888888" tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
              <Tooltip
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="votes" radius={[6, 6, 0, 0]} animationDuration={1000}>
                {results.map((entry: any, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
