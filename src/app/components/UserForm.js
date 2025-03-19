import { React } from 'react';
import { Box, TextField } from '@mui/material';

/**
 * User Form
 * 
 * Login Form sub-component
 */
export default function UserForm(p) {
    return (
        <Box>
            <TextField
                id={p.id}
                label={p.fieldLabel}
                variant='outlined'
                type='text'
                fullWidth
                required
                value={p.value}
                onChange={(e) => p.setInput(e.target.value)}
            >
            </TextField>
        </Box>
    );
}