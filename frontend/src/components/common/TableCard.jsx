import React from "react";
import {
  Card, CardContent, Box, Typography, Fade, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, CircularProgress, Alert, Tooltip, IconButton, Button, TextField, InputAdornment
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// TableCard: Card + Header + Table + Pagination + Actions
function TableCard({
  title,
  columns,
  rows,
  loading,
  error,
  searchTerm,
  onSearchChange,
  actionsHeader, // extra header actions (e.g. add button)
  renderActions, // function(row) => ReactNode (actions per row)
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  totalCount,
  headerCellStyle = {},
  bodyCellStyle = {},
  minWidth = 650,
  noResultsMsg = "No hay datos para mostrar.",
  searchPlaceholder = "Buscar...",
  context
}) {
  // --- Panel title logic ---
  const getPanelTitle = () => {
    if (title?.toLowerCase().includes('funcionario')) return 'Panel de Funcionarios';
    if (title?.toLowerCase().includes('vecino')) return 'Portal Vecino';
    if (title?.toLowerCase().includes('admin')) return 'Panel de Administración';
    return title || 'Panel';
  };

  if (!columns || columns.length === 0) {
    return (
      <Card sx={{ width: '100%', flexGrow: 1, borderRadius: 2, boxShadow: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'background.paper' }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 }, display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden', gap: 2.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, minHeight: 320, py: 6 }}>
            <InfoOutlinedIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 'bold', mb: 1 }}>
              {getPanelTitle()}
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.secondary', fontStyle: 'italic', textAlign: 'center' }}>
              Selecciona una sección del menú lateral.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{
      width: '100%',
      flexGrow: 1,
      height: '100%', // Ocupa todo el alto disponible
      borderRadius: 3,
      boxShadow: (theme) => theme.shadows[2],
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: (theme) => theme.palette.background.paper,
      border: (theme) => `1.5px solid ${theme.palette.primary.light}`,
      p: 0,
      m: 0,
      color: (theme) => theme.palette.text.primary,
      minHeight: 320,
    }}>
      <CardContent sx={{
        p: { xs: 1.5, sm: 2, md: 2.5 },
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        height: '100%', // Forzar a ocupar todo el alto
        overflow: 'hidden',
        gap: 1.5,
        background: 'transparent',
        m: 0,
      }}>
        {/* Header */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.2,
          flexShrink: 0,
          borderBottom: (theme) => `1.5px solid ${theme.palette.primary.light}`,
          pb: 1.2,
          mb: 0.7,
        }}>
          <Typography variant="h6" component="h1" sx={{ fontWeight: 800, color: (theme) => theme.palette.primary.main, mr: 'auto', letterSpacing: 0.2, fontSize: { xs: '0.99rem', sm: '1.09rem', md: '1.13rem' }, textTransform: 'uppercase', fontFamily: 'Montserrat, Arial, sans-serif' }}>{title}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'nowrap', ml: { xs: 0, sm: 1 } }}>
            {onSearchChange && (
              <TextField
                size="small"
                variant="outlined"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={onSearchChange}
                sx={{ width: { xs: '110px', sm: 150, md: 180 }, '& .MuiOutlinedInput-root': { borderRadius: '18px', background: (theme) => theme.palette.action.selected, boxShadow: 'none', fontWeight: 400, color: (theme) => theme.palette.text.primary }, fontSize: '0.97rem', input: { color: (theme) => theme.palette.text.primary } }}
                InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: (theme) => theme.palette.primary.main }} /></InputAdornment>) }}
              />
            )}
            {actionsHeader}
          </Box>
        </Box>
        {/* Indicadores */}
        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', my: 5, flexGrow: 1, gap: 2 }}>
            <CircularProgress size={30} thickness={4} />
            <Typography sx={{ color: 'text.secondary', fontStyle: 'italic', fontWeight: 400 }}>Cargando...</Typography>
          </Box>
        )}
        {!loading && error && (
          <Fade in={!loading && !!error} timeout={500}>
            <Alert severity="error" sx={{ mb: 2, flexShrink: 0, fontWeight: 400 }}>{error}</Alert>
          </Fade>
        )}
        {/* Tabla y paginación */}
        {!loading && !error && (
          <Fade in timeout={500} style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Paper sx={{
              flexGrow: 1,
              height: '100%', // Forzar a ocupar todo el alto
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              border: 'none',
              borderRadius: 2.5,
              width: '100%',
              background: (theme) => theme.palette.background.paper,
              boxShadow: (theme) => theme.shadows[1],
              m: 0,
              p: 0,
            }}>
              <TableContainer sx={{ flexGrow: 1, height: '100%', overflow: 'auto', borderRadius: 2.5, background: (theme) => theme.palette.background.paper }}>
                <Table stickyHeader size="small" sx={{ minWidth, borderCollapse: 'separate', borderSpacing: 0 }}>
                  <TableHead>
                    <TableRow>
                      {columns.map(col => (
                        <TableCell
                          key={col.id}
                          sx={{
                            ...headerCellStyle,
                            ...(col.headerStyle || {}),
                            textAlign: col.id === 'actions' ? 'right' : 'left',
                            fontWeight: 800,
                            fontSize: '0.93rem',
                            border: 'none',
                            borderBottom: (theme) => `2px solid ${theme.palette.primary.light}`,
                            background: (theme) => theme.palette.primary.main,
                            color: (theme) => theme.palette.primary.contrastText,
                            textTransform: 'uppercase',
                            px: 1.5,
                            py: 0.7,
                            letterSpacing: 0.11,
                            fontFamily: 'Montserrat, Arial, sans-serif',
                          }}
                        >
                          {col.label}
                        </TableCell>
                      ))}
                      {renderActions && <TableCell sx={{ ...headerCellStyle, textAlign: 'right', width: '90px', border: 'none', borderBottom: (theme) => `2px solid ${theme.palette.primary.light}`, background: (theme) => theme.palette.primary.main, color: (theme) => theme.palette.primary.contrastText, fontWeight: 800, fontSize: '0.93rem', textTransform: 'uppercase', px: 1.5, py: 0.7, letterSpacing: 0.11, fontFamily: 'Montserrat, Arial, sans-serif' }}>Acciones</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.length > 0 ? rows.map((row, idx) => (
                      <TableRow hover key={row.id || idx} sx={{ transition: 'background 0.2s', borderRadius: 2, '&:hover': { background: (theme) => theme.palette.action.hover } }}>
                        {columns.map(col => (
                          <TableCell key={col.id} sx={{ ...bodyCellStyle, ...(col.cellStyle || {}), border: 'none', borderBottom: (theme) => `1px solid ${theme.palette.primary.light}`, fontSize: '0.91rem', py: 0.7, px: 1.5, background: 'transparent', color: (theme) => theme.palette.text.primary, fontFamily: 'Montserrat, Arial, sans-serif' }}>{col.render ? col.render(row, context) : (row[col.id] ?? '-')}</TableCell>
                        ))}
                        {renderActions && <TableCell sx={{ ...bodyCellStyle, textAlign: 'right', whiteSpace: 'nowrap', border: 'none', borderBottom: (theme) => `1px solid ${theme.palette.primary.light}`, py: 0.7, px: 1.5, background: 'transparent', color: (theme) => theme.palette.text.primary, fontFamily: 'Montserrat, Arial, sans-serif' }}>{renderActions(row)}</TableCell>}
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={columns.length + (renderActions ? 1 : 0)} align="center" sx={{ py: 3, fontStyle: 'italic', color: (theme) => theme.palette.text.secondary, borderBottom: 'none', fontWeight: 400, fontSize: '0.93rem', background: 'transparent', fontFamily: 'Montserrat, Arial, sans-serif' }}>{noResultsMsg}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {totalCount > 0 && (
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, { label: 'Todo', value: -1 }]}
                  component="div"
                  count={totalCount}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={onPageChange}
                  onRowsPerPageChange={onRowsPerPageChange}
                  labelRowsPerPage="Filas por página:"
                  labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`}
                  sx={{ borderTop: (theme) => `1.5px solid ${theme.palette.divider}`, flexShrink: 0, color: (theme) => theme.palette.text.secondary, bgcolor: 'transparent', borderRadius: 0, fontWeight: 400, fontSize: '0.98rem' }}
                />
              )}
            </Paper>
          </Fade>
        )}
      </CardContent>
    </Card>
  );
}

export default TableCard;
