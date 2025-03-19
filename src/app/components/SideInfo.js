import { React } from 'react';
import { Box, Typography } from '@mui/material';
import styles from '../styles/sideInfo.module.css';

/**
 * Side Info
 * 
 * Title and supplemental information about the Traffic AI website
 */
export default function SideInfo() {
    return (
        <Box className={styles.sideInfo}>
            <Box className={styles.infoLabel}>
                <Typography  variant='h3'>
                    Traffic AI Crash Rate Predictor
                </Typography>
            </Box>
            <Box className={styles.info}>
                <Typography variant='body1'>
                    A platform to interact with models and predict crash rates on roads
                </Typography>
            </Box>
        </Box>
    );
}