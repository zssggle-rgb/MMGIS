import { useConfigureText } from "../../../../../i18n";
import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import CloseSharpIcon from "@mui/icons-material/CloseSharp";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles(() => ({
  flexBetween: { display: "flex", justifyContent: "space-between" },
}));

export default function DeleteItemModal({ classes, open, itemId, collectionId, confirmation, setConfirmation, onClose, onConfirm }) {
  const ct = useConfigureText();
  const local = useStyles();
  return (
    <Dialog className={classes.deleteDialog} open={open} onClose={onClose} aria-labelledby="delete-item-dialog-title">
      <DialogTitle className={classes.deleteDialogTitle}>
        <div className={classes.flexBetween}>
          <div className={classes.flexBetween}>
            <DeleteForeverIcon className={classes.backgroundIcon} />
            <div className={classes.title}>{ct("ui.delete_stac_item_6c555d")}</div>
          </div>
          <IconButton className={classes.closeIcon} title={ct("ui.close_bbfa77")} aria-label={ct("ui.close_da3886")} onClick={onClose}>
            <CloseSharpIcon fontSize="inherit" />
          </IconButton>
        </div>
      </DialogTitle>
      <DialogContent className={classes.deleteDialogContent}>
        <Typography className={classes.collectionTitle}>{ct("ui.collection_8fdd82")}{collectionId}</Typography>
        <Typography className={classes.deleteItemName}>{ct("ui.deleting_p0_644b33", { p0: itemId || "" })}</Typography>
        <TextField
          className={classes.deleteConfirmInput}
          label={ct("ui.confirm_item_id_9ac27f")}
          variant="filled"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          placeholder={ct("ui.type_p0_to_confirm_afc006", { p0: itemId })}
        />
        <Typography className={classes.deleteConfirmMessage}>
          {ct("ui.enter_p0_above_and_click_delete_f9efdf", { p0: itemId || "" })}
        </Typography>
      </DialogContent>
      <DialogActions className={classes.deleteDialogActions}>
        <Button className={classes.deleteButton} variant="contained" startIcon={<DeleteForeverIcon size="small" />} onClick={onConfirm}>{ct("ui.delete_f6fdbe")}</Button>
        <Button variant="outlined" onClick={onClose}>{ct("ui.cancel_77dfd2")}</Button>
      </DialogActions>
    </Dialog>
  );
}

