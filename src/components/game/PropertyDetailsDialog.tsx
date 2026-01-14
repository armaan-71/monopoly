'use client';

import {
    Dialog,
    DialogContent,
    Box,
    Typography,
    Table,
    TableBody,
    TableRow,
    TableCell,
    IconButton,
    useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { BOARD_CONFIG } from '@/constants/boardConfig';
import { PropertyGroup } from '@/types/game';

interface PropertyDetailsDialogProps {
    open: boolean;
    onClose: () => void;
    propertyId: number | null;
}

export default function PropertyDetailsDialog({ open, onClose, propertyId }: PropertyDetailsDialogProps) {
    const theme = useTheme();

    if (propertyId === null) return null;

    const property = BOARD_CONFIG.find(p => p.id === propertyId);
    if (!property) return null;

    const getGroupColor = (group: PropertyGroup) => {
        switch (group) {
            case 'brown': return theme.palette.brown.main;
            case 'lightBlue': return theme.palette.lightBlue.main;
            case 'pink': return theme.palette.pink.main;
            case 'orange': return theme.palette.orange.main;
            case 'red': return theme.palette.red.main;
            case 'yellow': return theme.palette.yellow.main;
            case 'green': return theme.palette.green.main;
            case 'darkBlue': return theme.palette.darkBlue.main;
            default: return theme.palette.grey[800];
        }
    };

    const headerColor = property.group !== 'none' ? getGroupColor(property.group) : theme.palette.grey[800];
    const isSpecial = property.group === 'special'; // Railroads / Utilities
    const isColorSet = property.group !== 'none' && property.group !== 'special';

    // Mortgage Value is typically half of the price
    const mortgageValue = property.price ? property.price / 2 : 0;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: 'background.paper',
                    border: `2px solid ${theme.palette.divider}`
                }
            }}
        >
            {/* Deed Header */}
            <Box sx={{
                bgcolor: headerColor,
                p: 3,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.palette.getContrastText(headerColor),
                borderBottom: `2px solid ${theme.palette.divider}`
            }}>
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: 'inherit'
                    }}
                >
                    <CloseIcon />
                </IconButton>

                <Typography variant="overline" sx={{ letterSpacing: 2, opacity: 0.8 }}>
                    TITLE DEED
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, textAlign: 'center', lineHeight: 1.2 }}>
                    {property.name.toUpperCase()}
                </Typography>
            </Box>

            <DialogContent sx={{ p: 0 }}>
                {property.price ? (
                    <Box sx={{ p: 2 }}>
                        {/* Rent Table for Color Properties */}
                        {isColorSet && property.rent && (
                            <Table size="small" sx={{ '& td': { borderBottom: 'none', py: 0.5 } }}>
                                <TableBody>
                                    <TableRow>
                                        <TableCell>Rent</TableCell>
                                        <TableCell align="right">${property.rent[0]}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>With 1 House</TableCell>
                                        <TableCell align="right">${property.rent[1]}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>With 2 Houses</TableCell>
                                        <TableCell align="right">${property.rent[2]}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>With 3 Houses</TableCell>
                                        <TableCell align="right">${property.rent[3]}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>With 4 Houses</TableCell>
                                        <TableCell align="right">${property.rent[4]}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>With HOTEL</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>${property.rent[5]}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        )}

                        {/* Special Properties (Railroads / Utilities) */}
                        {isSpecial && property.group === 'special' && (
                            <Box sx={{ py: 2, textAlign: 'center' }}>
                                {property.name.includes('Railroad') ? (
                                    <>
                                        <Typography variant="body2" sx={{ mb: 1 }}>Rent: $25</Typography>
                                        <Typography variant="body2" sx={{ mb: 1 }}>If 2 Railroads are owned: $50</Typography>
                                        <Typography variant="body2" sx={{ mb: 1 }}>If 3 Railroads are owned: $100</Typography>
                                        <Typography variant="body2">If 4 Railroads are owned: $200</Typography>
                                    </>
                                ) : (
                                    <>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            If one "Utility" is owned rent is 4 times amount shown on dice.
                                        </Typography>
                                        <Typography variant="body2">
                                            If both "Utilities" are owned rent is 10 times amount shown on dice.
                                        </Typography>
                                    </>
                                )}
                            </Box>
                        )}

                        <Box sx={{ my: 2, height: 1, bgcolor: 'divider' }} />

                        {/* Mortgage & House Cost Stats */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'center' }}>
                            <Typography variant="body2">
                                Mortgage Value: <strong>${mortgageValue}</strong>
                            </Typography>
                            {property.houseCost && (
                                <Typography variant="body2">
                                    Houses cost <strong>${property.houseCost}</strong> each
                                </Typography>
                            )}
                            {property.houseCost && (
                                <Typography variant="body2">
                                    Hotels cost <strong>${property.houseCost}</strong> plus 4 houses
                                </Typography>
                            )}
                        </Box>
                    </Box>
                ) : (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="body1">{property.description || 'No details available.'}</Typography>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}
