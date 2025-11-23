import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  ContentCopy as CopyIcon,
  AccessTime as TimeIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import logger from '../utils/logger';
import urlStorage from '../utils/urlStorage';

const URLShortener = () => {
  const navigate = useNavigate();
  const [urls, setUrls] = useState([
    { id: 1, originalURL: '', validityMinutes: 30, shortcode: '', errors: {} }
  ]);
  const [results, setResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalError, setGlobalError] = useState('');

  logger.info('URL Shortener component rendered');

  // Validate individual URL entry
  const validateURL = (url) => {
    const errors = {};
    
    if (!url.originalURL.trim()) {
      errors.originalURL = 'URL is required';
    } else if (!urlStorage.isValidURL(url.originalURL)) {
      errors.originalURL = 'Please enter a valid URL (must start with http:// or https://)';
    }

    if (url.validityMinutes && (!Number.isInteger(Number(url.validityMinutes)) || Number(url.validityMinutes) <= 0)) {
      errors.validityMinutes = 'Validity must be a positive integer (minutes)';
    }

    if (url.shortcode && !urlStorage.isValidShortcode(url.shortcode)) {
      errors.shortcode = 'Shortcode must be 3-10 characters (letters and numbers only)';
    }

    return errors;
  };

  // Update URL entry
  const updateURL = (id, field, value) => {
    logger.debug('Updating URL entry', { id, field, value });
    
    setUrls(prevUrls => 
      prevUrls.map(url => {
        if (url.id === id) {
          const updatedURL = { ...url, [field]: value };
          const errors = validateURL(updatedURL);
          return { ...updatedURL, errors };
        }
        return url;
      })
    );
    setGlobalError('');
  };

  // Add new URL entry (max 5)
  const addURLEntry = () => {
    if (urls.length >= 5) {
      setGlobalError('Maximum 5 URLs can be shortened concurrently');
      logger.warn('Attempted to add more than 5 URLs');
      return;
    }

    const newId = Math.max(...urls.map(u => u.id)) + 1;
    const newURL = { 
      id: newId, 
      originalURL: '', 
      validityMinutes: 30, 
      shortcode: '', 
      errors: {} 
    };
    
    setUrls([...urls, newURL]);
    logger.info('Added new URL entry', { id: newId });
  };

  // Remove URL entry
  const removeURLEntry = (id) => {
    if (urls.length <= 1) {
      setGlobalError('At least one URL entry is required');
      return;
    }

    setUrls(urls.filter(url => url.id !== id));
    logger.info('Removed URL entry', { id });
  };

  // Process all URLs
  const processURLs = async () => {
    logger.info('Starting URL processing', { urlCount: urls.length });
    setIsProcessing(true);
    setGlobalError('');
    setResults([]);

    try {
      // Validate all URLs first
      const validationErrors = [];
      const validatedUrls = urls.map(url => {
        const errors = validateURL(url);
        if (Object.keys(errors).length > 0) {
          validationErrors.push({ id: url.id, errors });
        }
        return { ...url, errors };
      });

      if (validationErrors.length > 0) {
        setUrls(validatedUrls);
        setGlobalError('Please fix the validation errors before proceeding');
        logger.warn('Validation errors found', { errors: validationErrors });
        return;
      }

      // Process each URL
      const processedResults = [];
      const shortcodeCollisions = [];

      for (const url of urls) {
        try {
          const result = urlStorage.createShortURL(
            url.originalURL,
            url.validityMinutes || 30,
            url.shortcode || null
          );
          
          processedResults.push({
            ...result,
            success: true,
            originalId: url.id
          });

          logger.info('URL processed successfully', { 
            shortcode: result.shortcode,
            originalURL: result.originalURL 
          });

        } catch (error) {
          logger.error('Failed to process URL', { 
            originalURL: url.originalURL,
            error: error.message 
          });

          if (error.message.includes('already taken')) {
            shortcodeCollisions.push(url.shortcode);
          }

          processedResults.push({
            success: false,
            error: error.message,
            originalURL: url.originalURL,
            originalId: url.id
          });
        }
      }

      setResults(processedResults);

      // Handle shortcode collisions
      if (shortcodeCollisions.length > 0) {
        setGlobalError(`Shortcode(s) already taken: ${shortcodeCollisions.join(', ')}. Please choose different shortcodes.`);
      }

      logger.info('URL processing completed', { 
        total: urls.length,
        successful: processedResults.filter(r => r.success).length,
        failed: processedResults.filter(r => !r.success).length
      });

    } catch (error) {
      logger.error('Unexpected error during URL processing', { error: error.message });
      setGlobalError('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      logger.info('URL copied to clipboard', { url: text });
    }).catch(err => {
      logger.error('Failed to copy to clipboard', { error: err.message });
    });
  };

  // Format expiry date
  const formatExpiryDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <LinkIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h3" component="h1" gutterBottom>
            URL Shortener
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Shorten up to 5 URLs concurrently with custom options
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<AnalyticsIcon />}
              onClick={() => navigate('/statistics')}
            >
              View Statistics
            </Button>
          </Box>
        </Box>

        {globalError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {globalError}
          </Alert>
        )}

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            URL Entries ({urls.length}/5)
          </Typography>
          
          {urls.map((url, index) => (
            <Card key={url.id} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    URL #{index + 1}
                  </Typography>
                  {urls.length > 1 && (
                    <IconButton 
                      onClick={() => removeURLEntry(url.id)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Original URL *"
                      placeholder="https://example.com/very-long-url"
                      value={url.originalURL}
                      onChange={(e) => updateURL(url.id, 'originalURL', e.target.value)}
                      error={!!url.errors.originalURL}
                      helperText={url.errors.originalURL}
                      variant="outlined"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Validity Period (minutes)"
                      type="number"
                      value={url.validityMinutes}
                      onChange={(e) => updateURL(url.id, 'validityMinutes', parseInt(e.target.value) || '')}
                      error={!!url.errors.validityMinutes}
                      helperText={url.errors.validityMinutes || 'Default: 30 minutes'}
                      variant="outlined"
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Custom Shortcode (optional)"
                      placeholder="mylink123"
                      value={url.shortcode}
                      onChange={(e) => updateURL(url.id, 'shortcode', e.target.value)}
                      error={!!url.errors.shortcode}
                      helperText={url.errors.shortcode || '3-10 characters, letters and numbers only'}
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addURLEntry}
              disabled={urls.length >= 5}
            >
              Add Another URL ({urls.length}/5)
            </Button>
            
            <Button
              variant="contained"
              size="large"
              onClick={processURLs}
              disabled={isProcessing || urls.some(url => Object.keys(url.errors).length > 0)}
              sx={{ ml: 'auto' }}
            >
              {isProcessing ? 'Processing...' : 'Shorten URLs'}
            </Button>
          </Box>
        </Box>

        {results.length > 0 && (
          <Box>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h5" gutterBottom>
              Results
            </Typography>
            
            {results.map((result, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  {result.success ? (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                          URL #{result.originalId} - Success
                        </Typography>
                        <Chip label="Active" color="success" size="small" />
                      </Box>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Original URL:
                          </Typography>
                          <Typography variant="body1" sx={{ wordBreak: 'break-all', mb: 2 }}>
                            {result.originalURL}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={8}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Shortened URL:
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography 
                              variant="h6" 
                              color="primary" 
                              sx={{ wordBreak: 'break-all', flexGrow: 1 }}
                            >
                              {result.shortURL}
                            </Typography>
                            <Tooltip title="Copy to clipboard">
                              <IconButton 
                                onClick={() => copyToClipboard(result.shortURL)}
                                size="small"
                              >
                                <CopyIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={4}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            <TimeIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                            Expires:
                          </Typography>
                          <Typography variant="body2">
                            {formatExpiryDate(result.expiryDate)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  ) : (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                          URL #{result.originalId} - Failed
                        </Typography>
                        <Chip label="Error" color="error" size="small" />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Original URL:
                      </Typography>
                      <Typography variant="body1" sx={{ wordBreak: 'break-all', mb: 2 }}>
                        {result.originalURL}
                      </Typography>
                      
                      <Alert severity="error">
                        {result.error}
                      </Alert>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default URLShortener;
