import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import {
  ErrorOutline as ErrorIcon,
  Launch as LaunchIcon
} from '@mui/icons-material';
import logger from '../utils/logger';
import urlStorage from '../utils/urlStorage';

const RedirectHandler = () => {
  const { shortcode } = useParams();
  const [status, setStatus] = useState('loading'); // loading, redirecting, error, expired
  const [error, setError] = useState('');
  const [originalURL, setOriginalURL] = useState('');

  useEffect(() => {
    const handleRedirect = async () => {
      logger.info('Redirect handler initiated', { shortcode });
      
      if (!shortcode) {
        logger.error('No shortcode provided in URL');
        setStatus('error');
        setError('Invalid URL - no shortcode provided');
        return;
      }

      try {
        // Get original URL with tracking
        const url = await urlStorage.getOriginalURL(shortcode);
        
        if (!url) {
          logger.warn('URL not found or expired', { shortcode });
          setStatus('expired');
          setError('This shortened URL has expired or does not exist');
          return;
        }

        setOriginalURL(url);
        setStatus('redirecting');
        
        // Redirect after a brief delay to show the redirect page
        const redirectTimer = setTimeout(() => {
          logger.info('Redirecting to original URL', { shortcode, originalURL: url });
          window.location.href = url;
        }, 2000);

        return () => clearTimeout(redirectTimer);
      } catch (error) {
        logger.error('Error during redirect handling', { shortcode, error: error.message });
        setStatus('error');
        setError('An error occurred while processing the redirect');
      }
    };

    handleRedirect();
  }, [shortcode]);

  const handleManualRedirect = () => {
    if (originalURL) {
      logger.info('Manual redirect initiated', { shortcode, originalURL });
      window.location.href = originalURL;
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h5" gutterBottom>
              Processing your request...
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Looking up shortened URL: {shortcode}
            </Typography>
          </Box>
        );

      case 'redirecting':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h5" gutterBottom>
              Redirecting...
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              You will be redirected to:
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                wordBreak: 'break-all', 
                backgroundColor: 'grey.100', 
                p: 2, 
                borderRadius: 1,
                mb: 3
              }}
            >
              {originalURL}
            </Typography>
            <Button
              variant="contained"
              startIcon={<LaunchIcon />}
              onClick={handleManualRedirect}
            >
              Go Now
            </Button>
          </Box>
        );

      case 'expired':
      case 'error':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 3 }} />
            <Typography variant="h5" gutterBottom color="error">
              {status === 'expired' ? 'Link Expired' : 'Error'}
            </Typography>
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              {error}
            </Alert>
            <Button
              variant="contained"
              onClick={() => window.location.href = '/'}
            >
              Go to URL Shortener
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center' }}>
          URL Shortener
        </Typography>
        {renderContent()}
      </Paper>
    </Container>
  );
};

export default RedirectHandler;
