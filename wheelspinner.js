import React, { useState, useRef, useEffect } from 'react';
import { Trash2, RefreshCw, Plus, Save, Upload } from 'lucide-react';

const WheelSpinner = () => {
  const [entries, setEntries] = useState([]);
  const [inputText, setInputText] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [history, setHistory] = useState([]);
  const [animation, setAnimation] = useState(false);
  const canvasRef = useRef(null);
  const pointerRef = useRef(null);
  const wheelRef = useRef(null);
  
  // Parse input text in format "Name x5"
  const parseInput = (text) => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    const newEntries = [];
    
    lines.forEach(line => {
      const match = line.match(/^(.+?)\s*x\s*(\d+)$/);
      if (match) {
        const name = match[1].trim();
        const count = parseInt(match[2], 10);
        if (name && !isNaN(count) && count > 0) {
          newEntries.push({ name, count });
        }
      }
    });
    
    return newEntries;
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleAddEntries = () => {
    const newEntries = parseInput(inputText);
    if (newEntries.length > 0) {
      setEntries(newEntries);
      setHistory([]);
      setSelectedEntry(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleAddEntries();
    }
  };

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (entries.length === 0) {
      // Draw empty wheel
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#f0f0f0';
      ctx.fill();
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw text
      ctx.font = '16px Arial';
      ctx.fillStyle = '#666';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Add entries to spin the wheel', centerX, centerY);
      return;
    }
    
    // Calculate total count
    const totalCount = entries.reduce((sum, entry) => sum + entry.count, 0);
    
    // Colors for wheel sections
    const colors = [
      '#4CAF50', // Green
      '#FFC107', // Amber
      '#2196F3', // Blue
      '#F44336', // Red
      '#9C27B0', // Purple
      '#FF9800', // Orange
      '#009688', // Teal
      '#E91E63', // Pink
    ];
    
    let startAngle = 0;
    let currentEntry = 0;
    
    // Draw wheel sections
    entries.forEach((entry, index) => {
      const portionOfWheel = entry.count / totalCount;
      const endAngle = startAngle + portionOfWheel * 2 * Math.PI;
      
      // Draw section
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw text
      const textAngle = startAngle + (endAngle - startAngle) / 2;
      const textX = centerX + (radius * 0.75) * Math.cos(textAngle);
      const textY = centerY + (radius * 0.75) * Math.sin(textAngle);
      
      // Rotate text
      ctx.save();
      ctx.translate(textX, textY);
      ctx.rotate(textAngle + Math.PI / 2);
      
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Truncate text if too long
      let displayText = entry.name;
      if (displayText.length > 15) {
        displayText = displayText.substring(0, 12) + '...';
      }
      
      ctx.fillText(displayText, 0, 0);
      ctx.fillText(`x${entry.count}`, 0, 20);
      ctx.restore();
      
      startAngle = endAngle;
    });
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.15, 0, 2 * Math.PI);
    ctx.fillStyle = '#333';
    ctx.fill();
    
    // Draw "SPIN" text
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPIN', centerX, centerY);
  };
  
  // Spin the wheel
  const spinWheel = () => {
    if (spinning || entries.length === 0) return;
    
    setSpinning(true);
    setSelectedEntry(null);
    setAnimation(true);
    
    // Calculate total count
    const totalCount = entries.reduce((sum, entry) => sum + entry.count, 0);
    
    // Random angle between 5-10 rotations plus the random winner position
    const totalRotation = Math.floor(Math.random() * 5 + 5) * 360;
    const randomValue = Math.random() * totalCount;
    
    // Figure out which entry was selected
    let countSum = 0;
    let selectedIndex = 0;
    
    for (let i = 0; i < entries.length; i++) {
      countSum += entries[i].count;
      if (randomValue <= countSum) {
        selectedIndex = i;
        break;
      }
    }
    
    // Calculate the angle to the middle of the selected section
    let portionsBefore = 0;
    for (let i = 0; i < selectedIndex; i++) {
      portionsBefore += entries[i].count;
    }
    
    const portionSelected = entries[selectedIndex].count;
    const portionCenter = portionsBefore + (portionSelected / 2);
    const selectedAngle = (portionCenter / totalCount) * 360;
    
    // Target angle: pointer at top (270 degrees) minus the selected angle
    // Adding totalRotation to ensure multiple spins
    const targetAngle = totalRotation + (270 - selectedAngle);
    
    // Apply rotation to the wheel
    if (wheelRef.current) {
      wheelRef.current.style.transition = 'transform 4s cubic-bezier(0.2, 0.1, 0.25, 1)';
      wheelRef.current.style.transform = `rotate(${targetAngle}deg)`;
    }
    
    // Set timeout to update the state after spinning
    setTimeout(() => {
      setSpinning(false);
      setSelectedEntry(entries[selectedIndex]);
      setAnimation(false);
      
      // Add to history
      setHistory([...history, entries[selectedIndex]]);
      
      // Remove the entry or decrease its count
      const newEntries = [...entries];
      if (newEntries[selectedIndex].count <= 1) {
        newEntries.splice(selectedIndex, 1);
      } else {
        newEntries[selectedIndex] = {
          ...newEntries[selectedIndex],
          count: newEntries[selectedIndex].count - 1
        };
      }
      setEntries(newEntries);
    }, 4000);
  };
  
  const resetWheel = () => {
    setEntries([...entries, ...history]);
    setHistory([]);
    setSelectedEntry(null);
  };
  
  const clearWheel = () => {
    setEntries([]);
    setHistory([]);
    setSelectedEntry(null);
    setInputText('');
  };
  
  // Download entries as a text file
  const downloadEntries = () => {
    const allEntries = [...entries, ...history];
    const content = allEntries.map(entry => `${entry.name} x${entry.count}`).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wheel-entries.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Load entries from a file
  const uploadEntries = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setInputText(content);
      const newEntries = parseInput(content);
      if (newEntries.length > 0) {
        setEntries(newEntries);
        setHistory([]);
        setSelectedEntry(null);
      }
    };
    reader.readAsText(file);
  };
  
  // Draw the wheel whenever entries change
  useEffect(() => {
    drawWheel();
  }, [entries, spinning]);
  
  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto p-4 bg-gray-50 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Wheel Spinner</h1>
      
      <div className="flex w-full gap-4 flex-col md:flex-row">
        <div className="flex-1 p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Input Entries</h2>
          <div className="mb-4">
            <textarea
              className="w-full h-64 p-2 border rounded"
              placeholder="Enter names in format: Name x5&#10;Example:&#10;John x3&#10;Mary x2&#10;Bob x1"
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="flex justify-between">
            <button
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={handleAddEntries}
            >
              <Plus size={16} className="mr-2" />
              Add Entries
            </button>
            <div className="flex gap-2">
              <button
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                onClick={downloadEntries}
              >
                <Save size={16} className="mr-2" />
                Save
              </button>
              <label className="flex items-center px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 cursor-pointer">
                <Upload size={16} className="mr-2" />
                Load
                <input type="file" accept=".txt" className="hidden" onChange={uploadEntries} />
              </label>
              <button
                className="flex items-center px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={clearWheel}
              >
                <Trash2 size={16} className="mr-2" />
                Clear All
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col items-center p-4 bg-white rounded-lg shadow">
          <div className="relative mb-4 w-full max-w-md">
            <div 
              ref={wheelRef} 
              className={`w-full aspect-square rounded-full relative overflow-hidden ${animation ? '' : 'transition-none'}`}
              onClick={spinning ? null : spinWheel}
            >
              <canvas ref={canvasRef} width="400" height="400" className="w-full h-full cursor-pointer" />
            </div>
            <div ref={pointerRef} className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0">
              <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-b-[30px] border-l-transparent border-r-transparent border-b-black" />
            </div>
          </div>
          
          <div className="w-full max-w-md">
            {selectedEntry && (
              <div className="p-4 mb-4 bg-yellow-100 border border-yellow-300 rounded-lg text-center">
                <h2 className="text-lg font-semibold">Selected:</h2>
                <p className="text-2xl font-bold">{selectedEntry.name}</p>
              </div>
            )}
            
            <div className="flex justify-between w-full mt-4">
              <button
                className={`flex items-center px-4 py-2 rounded ${
                  entries.length > 0 && !spinning
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                onClick={spinWheel}
                disabled={entries.length === 0 || spinning}
              >
                Spin Wheel
              </button>
              
              <button
                className={`flex items-center px-4 py-2 rounded ${
                  history.length > 0 && !spinning
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                onClick={resetWheel}
                disabled={history.length === 0 || spinning}
              >
                <RefreshCw size={16} className="mr-2" />
                Reset Wheel
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="w-full flex flex-col md:flex-row gap-4 mt-6">
        <div className="flex-1 p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Remaining Entries ({entries.reduce((sum, entry) => sum + entry.count, 0)})</h2>
          <div className="max-h-64 overflow-y-auto">
            {entries.length > 0 ? (
              <ul className="divide-y">
                {entries.map((entry, index) => (
                  <li key={index} className="py-2 flex justify-between">
                    <span>{entry.name}</span>
                    <span className="font-semibold">x{entry.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No entries remaining</p>
            )}
          </div>
        </div>
        
        <div className="flex-1 p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">History ({history.length})</h2>
          <div className="max-h-64 overflow-y-auto">
            {history.length > 0 ? (
              <ul className="divide-y">
                {history.map((entry, index) => (
                  <li key={index} className="py-2">
                    {entry.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No history yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WheelSpinner;