'use client';

import { Box, Button, TextField, Typography, Paper, Container } from '@mui/material';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LobbyPage() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async () => {
    if (!playerName) return alert('Enter name first');
    setLoading(true);
    try {
      // 1. Create Room
      const res = await fetch('/api/rooms/create', { method: 'POST' });
      const room = await res.json();

      // 2. Join as Host
      await joinRoom(room.code, true);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const joinRoom = async (code: string, isFromCreate = false) => {
    // 3. Join API
    const res = await fetch('/api/rooms/join', {
      method: 'POST',
      body: JSON.stringify({
        roomCode: code,
        playerName,
        avatarId: 'top-hat', // Default for now
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const playerId = data.player.id;
      // Store identity in localStorage so we remember who we are in the room
      localStorage.setItem(`monopoly_player_${data.room.id}`, playerId);
      router.push(`/game/${data.room.id}`);
    } else {
      alert('Failed to join');
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper sx={{ p: 4, width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Typography variant="h3" align="center" fontWeight="bold">
          MONOPOLY
        </Typography>

        <TextField
          label="Your Name"
          fullWidth
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />

        <Box sx={{ borderTop: '1px solid #eee' }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6">Join Existing Game</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="Room Code"
              size="small"
              fullWidth
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            />
            <Button
              variant="contained"
              disabled={loading || !playerName || !roomCode}
              onClick={() => joinRoom(roomCode)}
            >
              Joins
            </Button>
          </Box>
        </Box>

        <Typography align="center" variant="body2" color="text.secondary">- OR -</Typography>

        <Button
          variant="contained"
          color="secondary"
          size="large"
          disabled={loading || !playerName}
          onClick={handleCreateRoom}
          fullWidth
        >
          Start New Game
        </Button>
      </Paper>
    </Container>
  );
}
