import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Alert,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Analytics as AnalyticsIcon,
  Link as LinkIcon,
  AccessTime as TimeIcon,
  Mouse as ClickIcon,
  Public as LocationIcon,
  Source as SourceIcon,
  ArrowBack as BackIcon,
  ContentCopy as CopyIcon,
  Launch as LaunchIcon
} from '@mui/icons-material';
import logger from '../utils/logger';
import urlStorage from '../utils/urlStorage';

const Statistics = () => {
  const navigate = useNavigate();
  const [urlData, setUrlData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    logger.info('Statistics page loaded');
    loadStatistics();
  }, []);

  const loadStatistics = () => {
    try {
      const allUrls = urlStorage.getAllURLs();
      logger.info('Loaded URL statistics', { urlCount: allUrls.length });
      setUrlData(allUrls);
    } catch (error) {
      logger.error('Failed to load statistics', { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      logger.info('URL copied to clipboard from statistics', { url: text });
    }).catch(err => {
      logger.error('Failed to copy to clipboard', { error: err.message });
    });
  };

  const openShortUrl = (shortcode) => {
    const shortUrl = `http://localhost:3000/${shortcode}`;
    window.open(shortUrl, '_blank');
    logger.info('Opened short URL from statistics', { shortcode });
  };

  const getTotalClicks = () => {
    return urlData.reduce((total, url) => total + (url.clicks || 0), 0);
  };

  const getActiveUrls = () => {
    const now = new Date();
    return urlData.filter(url => new Date(url.expiryDate) > now).length;
  };

  const getExpiredUrls = () => {
    const now = new Date();
    return urlData.filter(url => new Date(url.expiryDate) <= now).length;
  };

  const isExpired = (expiryDate) => {
    return new Date() > new Date(expiryDate);
  };

  const getClicksByLocation = (clickHistory) => {
    const locationCounts = {};
    if (clickHistory) {
      clickHistory.forEach(click => {
        const location = `${click.location.city}, ${click.location.country}`;
        locationCounts[location] = (locationCounts[location] || 0) + 1;
      });
    }
    return locationCounts;
  };

  const getClicksBySource = (clickHistory) => {
    const sourceCounts = {};
    if (clickHistory) {
      clickHistory.forEach(click => {
        const source = click.source.source;
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      });
    }
    return sourceCounts;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h5">Loading statistics...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
              <BackIcon />
            </IconButton>
            <AnalyticsIcon sx={{ fontSize: 48, color: 'primary.main', mr: 2 }} />
            <Typography variant="h3" component="h1">
              URL Statistics
            </Typography>
          </Box>
          <Typography variant="h6" color="text.secondary">
            Comprehensive analytics for all shortened URLs
          </Typography>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <LinkIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" component="div">
                  {urlData.length}
                </Typography>
                <Typography color="text.secondary">
                  Total URLs
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <ClickIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" component="div">
                  {getTotalClicks()}
                </Typography>
                <Typography color="text.secondary">
                  Total Clicks
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TimeIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                <Typography variant="h4" component="div">
                  {getActiveUrls()}
                </Typography>
                <Typography color="text.secondary">
                  Active URLs
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TimeIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                <Typography variant="h4" component="div">
                  {getExpiredUrls()}
                </Typography>
                <Typography color="text.secondary">
                  Expired URLs
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* URL List */}
        {urlData.length === 0 ? (
          <Alert severity="info">
            No URLs have been created yet. <Button onClick={() => navigate('/')}>Create your first URL</Button>
          </Alert>
        ) : (
          <Box>
            <Typography variant="h5" gutterBottom>
              URL Details ({urlData.length})
            </Typography>
            
            {urlData.map((url, index) => (
              <Accordion key={url.shortcode} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6">
                        {url.shortcode}
                        {isExpired(url.expiryDate) ? (
                          <Chip label="Expired" color="error" size="small" sx={{ ml: 2 }} />
                        ) : (
                          <Chip label="Active" color="success" size="small" sx={{ ml: 2 }} />
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {url.clicks || 0} clicks • Created {formatDate(url.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>
                
                <AccordionDetails>
                  <Grid container spacing={3}>
                    {/* Basic Information */}
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Basic Information
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Original URL:
                        </Typography>
                        <Typography variant="body1" sx={{ wordBreak: 'break-all', mb: 1 }}>
                          {url.originalURL}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Shortened URL:
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" color="primary" sx={{ flexGrow: 1 }}>
                            http://localhost:3000/{url.shortcode}
                          </Typography>
                          <Tooltip title="Copy to clipboard">
                            <IconButton 
                              onClick={() => copyToClipboard(`http://localhost:3000/${url.shortcode}`)}
                              size="small"
                            >
                              <CopyIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Open in new tab">
                            <IconButton 
                              onClick={() => openShortUrl(url.shortcode)}
                              size="small"
                            >
                              <LaunchIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Created:
                          </Typography>
                          <Typography variant="body1">
                            {formatDate(url.createdAt)}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Expires:
                          </Typography>
                          <Typography variant="body1" color={isExpired(url.expiryDate) ? 'error' : 'inherit'}>
                            {formatDate(url.expiryDate)}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Validity Period:
                          </Typography>
                          <Typography variant="body1">
                            {url.validityMinutes} minutes
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Total Clicks:
                          </Typography>
                          <Typography variant="body1">
                            {url.clicks || 0}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Grid>

                    {/* Click Analytics */}
                    {url.clickHistory && url.clickHistory.length > 0 && (
                      <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="h6" gutterBottom>
                          <AnalyticsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                          Click Analytics
                        </Typography>
                        
                        {/* Location Analytics */}
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            <LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Clicks by Location
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {Object.entries(getClicksByLocation(url.clickHistory)).map(([location, count]) => (
                              <Chip 
                                key={location} 
                                label={`${location} (${count})`} 
                                variant="outlined" 
                                size="small" 
                              />
                            ))}
                          </Box>
                        </Box>
                        
                        {/* Source Analytics */}
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            <SourceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Clicks by Source
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {Object.entries(getClicksBySource(url.clickHistory)).map(([source, count]) => (
                              <Chip 
                                key={source} 
                                label={`${source} (${count})`} 
                                variant="outlined" 
                                size="small" 
                              />
                            ))}
                          </Box>
                        </Box>
                        
                        {/* Detailed Click History */}
                        <Typography variant="subtitle1" gutterBottom>
                          Detailed Click History
                        </Typography>
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Timestamp</TableCell>
                                <TableCell>Source</TableCell>
                                <TableCell>Browser</TableCell>
                                <TableCell>Location</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {url.clickHistory.slice().reverse().map((click, clickIndex) => (
                                <TableRow key={click.clickId || clickIndex}>
                                  <TableCell>
                                    {formatDate(click.timestamp)}
                                  </TableCell>
                                  <TableCell>
                                    {click.source.source}
                                  </TableCell>
                                  <TableCell>
                                    {click.source.browser}
                                  </TableCell>
                                  <TableCell>
                                    {click.location.city}, {click.location.country}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Grid>
                    )}
                    
                    {(!url.clickHistory || url.clickHistory.length === 0) && (
                      <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Alert severity="info">
                          No clicks recorded yet for this URL.
                        </Alert>
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
        
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button 
            variant="contained" 
            onClick={() => navigate('/')}
            startIcon={<LinkIcon />}
          >
            Create New URLs
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Statistics;
