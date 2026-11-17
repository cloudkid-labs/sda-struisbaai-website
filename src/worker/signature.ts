/**
 * The church's HTML mail signature, inlined from
 * `Claude outputs/signature.html` (email clients fetch no repo files, so the
 * Worker carries the markup). One parameter: the sending role address, which
 * fills the signature's contact line so a klerk@ mail is not signed welkom@.
 */

/** Escape-then-breaks: user text into one safe HTML block. */
export function htmlBody(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return (
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:#17252e;">` +
    `${escaped.replace(/\n/g, '<br>')}</div>`
  );
}

export const LOGO_REMOTE_URL = 'https://sdastruisbaai.co.za/oauth-logo.png';

export function signatureHtml(from: string, logoSrc: string): string {
  return (
    `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;color:#3f4d55;">` +
    `<tr><td valign="middle" style="padding:0 14px 0 0;">` +
    `<a href="https://sdastruisbaai.co.za" style="text-decoration:none;">` +
    `<img src="${logoSrc}" width="72" height="72" alt="Struisbaai SDA Kerk" style="display:block;border:0;width:72px;height:72px;"></a>` +
    `</td><td width="3" bgcolor="#e8862c" style="width:3px;font-size:0;line-height:0;">&nbsp;</td>` +
    `<td valign="middle" style="padding:0 0 0 14px;font-size:13px;line-height:19px;">` +
    `<div style="font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:22px;font-weight:bold;color:#0b3d54;">Struisbaai SDA Kerk</div>` +
    `<div style="color:#3f4d55;"><a href="mailto:${from}" style="color:#0b3d54;text-decoration:none;">${from}</a></div>` +
    `<div style="color:#55646b;">Struisbaai Library Hall, Struisbaai &nbsp;&middot;&nbsp; ` +
    `<a href="https://sdastruisbaai.co.za" style="color:#0b3d54;text-decoration:none;">sdastruisbaai.co.za</a></div>` +
    `</td></tr></table>`
  );
}

/** Full HTML alternative for a board-mail send: the message, then the signature. */
export function mailHtml(text: string, from: string, logoSrc: string): string {
  return `${htmlBody(text)}<br><br>${signatureHtml(from, logoSrc)}`;
}
