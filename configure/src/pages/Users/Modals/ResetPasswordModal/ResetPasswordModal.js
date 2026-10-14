import { useConfigureText } from "../../../../i18n";
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import { calls } from "../../../../core/calls";
import { publicUrlMainSite } from "../../../../core/constants";

import { setModal, setSnackBarText } from "../../../../core/ConfigureStore";

import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";

import CloseSharpIcon from "@mui/icons-material/CloseSharp";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";

import TextField from "@mui/material/TextField";

import { makeStyles, useTheme } from "@mui/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

const useStyles = makeStyles((theme) => ({
  Modal: {
    margin: theme.headHeights[1],
    [theme.breakpoints.down("xs")]: {
      margin: "6px",
    },
    "& .MuiDialog-container": {
      height: "unset !important",
      transform: "translateX(-50%) translateY(-50%)",
      left: "50%",
      top: "50%",
      position: "absolute",
    },
  },
  contents: {
    background: theme.palette.primary.main,
    height: "100%",
    width: "700px",
  },
  contentsLink: {
    background: theme.palette.primary.main,
    height: "100%",
    width: "1000px",
    maxWidth: "1000px !important",
  },
  heading: {
    height: theme.headHeights[2],
    boxSizing: "border-box",
    background: theme.palette.swatches.p[0],
    borderBottom: `1px solid ${theme.palette.swatches.grey[800]}`,
    padding: `4px ${theme.spacing(2)} 4px ${theme.spacing(4)} !important`,
  },
  title: {
    padding: `8px 0px`,
    fontSize: theme.typography.pxToRem(16),
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  content: {
    padding: "8px 16px 16px 16px !important",
    height: `calc(100% - ${theme.headHeights[2]}px)`,
  },
  closeIcon: {
    padding: theme.spacing(1.5),
    height: "100%",
    margin: "4px 0px",
  },
  flexBetween: {
    display: "flex",
    justifyContent: "space-between",
  },
  subtitle: {
    fontSize: "14px !important",
    width: "100%",
    marginBottom: "8px !important",
    color: theme.palette.swatches.grey[300],
    letterSpacing: "0.2px",
  },
  subtitle2: {
    fontSize: "12px !important",
    fontStyle: "italic",
    width: "100%",
    marginBottom: "8px !important",
    color: theme.palette.swatches.grey[400],
  },
  confirmInput: {
    width: "100%",
    margin: "10px 0px 4px 0px !important",
    borderTop: `1px solid ${theme.palette.swatches.grey[500]}`,
  },
  backgroundIcon: {
    margin: "7px 8px 0px 0px",
  },
  fileName: {
    textAlign: "center",
    fontWeight: "bold",
    letterSpacing: "1px",
    marginBottom: "10px",
    borderBottom: `1px solid ${theme.palette.swatches.grey[500]}`,
    paddingBottom: "10px",
  },
  mission: {
    background: theme.palette.swatches.p[11],
    color: theme.palette.swatches.grey[900],
    height: "24px",
    lineHeight: "24px",
    padding: "0px 5px",
    borderRadius: "3px",
    display: "inline-block",
    letterSpacing: "1px",
    marginLeft: "20px",
  },
  pathName: {
    display: "flex",
    marginLeft: "40px",
    marginTop: "4px",
    height: "24px",
    lineHeight: "24px",
  },
  path: {
    color: theme.palette.swatches.grey[500],
  },
  name: {
    color: theme.palette.swatches.grey[100],
    fontWeight: "bold",
  },
  confirmMessage: {
    fontStyle: "italic",
    fontSize: "15px !important",
  },
  dialogActions: {
    display: "flex !important",
    justifyContent: "space-between !important",
  },
  submit: {
    background: `${theme.palette.swatches.p[0]} !important`,
    color: `${theme.palette.swatches.grey[1000]} !important`,
    "&:hover": {
      background: `${theme.palette.swatches.grey[0]} !important`,
    },
  },
  cancel: {},
  dropdown: {
    width: "100%",
    marginTop: "20px",
  },
  generated: {
    height: "42px",
    lineHeight: "42px",
    display: "flex",
    marginBottom: "20px",
    border: `2px solid ${theme.palette.swatches.p[0]}`,
    borderRadius: "4px",
    boxShadow: `0px 2px 2px 0px rgba(0,0,0,0.2)`,
    "& > div:nth-child(1)": {
      padding: "0px 16px",
      background: theme.palette.swatches.p[0],
      textTransform: "uppercase",
      fontSize: "13px",
    },
    "& > div:nth-child(2)": {
      padding: "0px 16px",
    },
    "& > div:nth-child(3)": {
      height: "42px",
    },
  },
  resetLink: {
    whiteSpace: "nowrap",
    lineHeight: "42px !important",
    padding: "0px 12px",
    flex: "1",
    overflowX: "auto",
    overflowY: "hidden",
    border: "none",
  },
  message: {
    fontSize: "18px !important",
    textAlign: "center !important",
    letterSpacing: "1px !important",
    color: `${theme.palette.swatches.r[4]} !important`,
    margin: "6px 0pc !important",
    fontWeight: "bold !important",
    textTransform: "uppercase",
  },
  message2: {
    display: "flex",
    justifyContent: "space-between",
    margin: "6px 0px",
    "& > div:first-child": {
      color: theme.palette.swatches.grey[200],
      fontStyle: "italic",
    },
    "& > div:last-child": {
      color: theme.palette.swatches.grey[100],
      fontWeight: "bold",
    },
  },
}));

const MODAL_NAME = "resetPassword";
const ResetPasswordModal = (props) => {
  const ct = useConfigureText();
  const { queryUsers } = props;
  const c = useStyles();

  const modal = useSelector((state) => state.core.modal[MODAL_NAME]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const dispatch = useDispatch();

  const [expires, setExpires] = useState(3600000);
  const [userName, setUserName] = useState(null);
  const [passwordResetLink, setPasswordResetLink] = useState(null);
  const [passwordResetLinkExpiration, setPasswordResetLinkExpiration] =
    useState(null);

  const handleClose = () => {
    setExpires(3600000);
    setPasswordResetLink(null);
    setPasswordResetLinkExpiration(null);
    setUserName(null);
    // close modal
    dispatch(setModal({ name: MODAL_NAME, on: false }));
  };
  const handleSubmit = () => {
    if (!modal?.row?.id) {
      dispatch(
        setSnackBarText({
          text: ct("ui.cannot_update_undefined_user_a2017f"),
          severity: "error",
        })
      );
      return;
    }

    if (userName !== modal.row.username) {
      dispatch(
        setSnackBarText({
          text: ct("ui.confirmation_username_does_not_match_137062"),
          severity: "error",
        })
      );
      return;
    }

    calls.api(
      "account_reset_password_link",
      {
        id: modal.row.id,
        expires: expires,
      },
      (res) => {
        if (res.body?.resetToken != null) {
          setPasswordResetLink(res.body.resetToken);
          setPasswordResetLinkExpiration(res.body.resetTokenExpiration);
          dispatch(
            setSnackBarText({
              text: ct("ui.successfully_generated_a_password_reset_link_880204", { p0: modal.row.username }),
              severity: "success",
            })
          );
        } else {
          dispatch(
            setSnackBarText({
              text: ct("ui.failed_to_generate_a_password_reset_1bedf5", { p0: modal.row.username }),
              severity: "error",
            })
          );
        }
      },
      (res) => {
        dispatch(
          setSnackBarText({
            text: ct("ui.failed_to_generate_a_password_reset_1bedf5", { p0: modal.row.username }),
            severity: "error",
          })
        );
      }
    );
  };

  return (
    <Dialog
      className={c.Modal}
      fullScreen={isMobile}
      open={modal !== false}
      onClose={handleClose}
      aria-labelledby="responsive-dialog-title"
      PaperProps={{
        className: passwordResetLink == null ? c.contents : c.contentsLink,
      }}
    >
      <DialogTitle className={c.heading}>
        <div className={c.flexBetween}>
          <div className={c.flexBetween}>
            <AccountBoxIcon className={c.backgroundIcon} />
            <div
              className={c.title}
            >{ct("ui.generate_a_password_reset_link_for_bc338c", { p0: modal?.row?.username })}</div>
          </div>
          <IconButton
            className={c.closeIcon}
            title={ct("ui.close_bbfa77")}
            aria-label={ct("ui.close_da3886")}
            onClick={handleClose}
          >
            <CloseSharpIcon fontSize="inherit" />
          </IconButton>
        </div>
      </DialogTitle>
      {passwordResetLink == null ? (
        <>
          <DialogContent className={c.content}>
            <Typography
              className={c.subtitle2}
            >{ct("ui.generates_a_single_use_password_reset_2e1da0")}</Typography>

            <FormControl className={c.dropdown} variant="filled" size="small">
              <InputLabel>{ct("ui.expires_a99be3")}</InputLabel>
              <Select
                value={expires || 3600000}
                onChange={(e) => {
                  setExpires(e.target.value);
                }}
              >
                <MenuItem value={3600000}>{ct("ui.1_hour_f030c3")}</MenuItem>
                <MenuItem value={28800000}>{ct("ui.8_hours_191800")}</MenuItem>
                <MenuItem value={86400000}>{ct("ui.1_day_2d8a6f")}</MenuItem>
                <MenuItem value={259200000}>{ct("ui.3_days_09ad9d")}</MenuItem>
                <MenuItem value={604800000}>{ct("ui.1_week_fdb8d5")}</MenuItem>
              </Select>
            </FormControl>
            <Typography className={c.subtitle2}>{``}</Typography>
            <TextField
              className={c.confirmInput}
              label={ct("ui.confirm_username_5edd50")}
              variant="filled"
              value={userName}
              inputProps={{
                autoComplete: "off",
              }}
              onChange={(e) => {
                setUserName(e.target.value);
              }}
            />
            <Typography
              className={c.subtitle2}
            >{ct("ui.confirm_their_username_before_generating_a_ab81a4")}</Typography>
          </DialogContent>
          <DialogActions className={c.dialogActions}>
            <Button
              variant="contained"
              startIcon={<AdminPanelSettingsIcon size="small" />}
              onClick={handleSubmit}
            >{ct("ui.generate_fc45f9")}</Button>
            <Button
              className={c.cancel}
              variant="outlined"
              onClick={handleClose}
            >{ct("ui.cancel_77dfd2")}</Button>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogContent className={c.content}>
            <Typography
              className={c.message}
            >{ct("ui.securely_send_this_password_reset_link_5ff1e5")}</Typography>
            <div className={c.generated}>
              <div className={c.resetLinkTitle}>{ct("ui.reset_link_06f2d6")}</div>
              <textarea
                readonly={true}
                className={c.resetLink}
                id="resetPasswordLink"
              >{`${publicUrlMainSite}/resetPassword?t=${passwordResetLink}`}</textarea>
              <Tooltip
                title={ct("ui.copy_reset_link_to_clipboard_077c8b")}
                placement="top"
                arrow
              >
                <IconButton
                  className={c.copy2clipboard}
                  onClick={() => {
                    if (passwordResetLink) {
                      document.getElementById("resetPasswordLink").select(); // Select the <textarea> content
                      document.execCommand("copy");
                      dispatch(
                        setSnackBarText({
                          text: ct("ui.copied_password_reset_link_to_clipboard_4ad83a"),
                          severity: "success",
                        })
                      );
                    }
                  }}
                >
                  <ContentPasteIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            </div>
            <div className={c.message2}>
              <div>{ct("ui.username_17dfb0")}</div>
              <div>{modal.row.username}</div>
            </div>
            <div className={c.message2}>
              <div>{ct("ui.email_4c4e6b")}</div>
              <div>{modal.row.email}</div>
            </div>
            <div className={c.message2}>
              <div>{ct("ui.link_expires_at_62cdca")}</div>
              <div>{new Date(passwordResetLinkExpiration).toString()}</div>
            </div>
          </DialogContent>
          <DialogActions className={c.dialogActions}>
            <Button
              className={c.cancel}
              variant="outlined"
              onClick={handleClose}
            >{ct("ui.done_e9b450")}</Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default ResetPasswordModal;
