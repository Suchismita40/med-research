// Private Medical Research Data Exchange Root App Component

import React, { useEffect, useState } from 'react';
import { Box, Container } from '@mui/material';
import { Header } from './components/Layout/Header';
import { Board } from './components/Board';
import { useDeployedBoardContext } from './hooks';
import { type BoardDeployment } from './contexts';
import { type Observable } from 'rxjs';

const App: React.FC = () => {
  const boardApiProvider = useDeployedBoardContext();
  const [boardDeployments, setBoardDeployments] = useState<Array<Observable<BoardDeployment>>>([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const subscription = boardApiProvider.boardDeployments$.subscribe(setBoardDeployments);
    return () => {
      subscription.unsubscribe();
    };
  }, [boardApiProvider]);

  return (
    <Box sx={{ background: '#FAFAFA', minHeight: '100vh', pb: 6 }}>
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {boardDeployments.map((boardDeployment, idx) => (
          <Box key={`board-${idx}`} sx={{ mb: 3 }}>
            <Board boardDeployment$={boardDeployment} activeTab={activeTab} />
          </Box>
        ))}
        {boardDeployments.length === 0 && <Board activeTab={activeTab} />}
      </Container>
    </Box>
  );
};

export default App;
