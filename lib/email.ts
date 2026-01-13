import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendDepositApprovalEmail(email: string, amount: number, asset: string) {
  try {
    await resend.emails.send({
      from: 'CryptoVault <noreply@cryptovault.com>',
      to: email,
      subject: '✅ Deposit Approved',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8b5cf6;">Deposit Approved</h2>
          <p>Your deposit of <strong>${amount} ${asset}</strong> has been approved and added to your account balance.</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Amount:</strong> $${amount} (${amount} ${asset})</p>
            <p><strong>Status:</strong> Approved ✅</p>
          </div>
          <p>You can now use these funds for trading or withdrawals.</p>
        </div>
      `
    })
  } catch (error) {
    console.error('Email sending error:', error)
  }
}

export async function sendWithdrawalApprovalEmail(email: string, amount: number, asset: string, wallet: string) {
  try {
    await resend.emails.send({
      from: 'CryptoVault <noreply@cryptovault.com>',
      to: email,
      subject: '✅ Withdrawal Approved',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8b5cf6;">Withdrawal Approved</h2>
          <p>Your withdrawal request has been approved and is being processed.</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Amount:</strong> ${amount} ${asset}</p>
            <p><strong>To Wallet:</strong> ${wallet.substring(0, 8)}...${wallet.substring(wallet.length - 8)}</p>
            <p><strong>Status:</strong> Processing ⏳</p>
          </div>
          <p>Funds will be sent to your wallet within 24 hours.</p>
        </div>
      `
    })
  } catch (error) {
    console.error('Email sending error:', error)
  }
}

export async function sendRejectionEmail(email: string, type: 'deposit' | 'withdrawal', amount: number, asset: string, reason?: string) {
  try {
    await resend.emails.send({
      from: 'CryptoVault <noreply@cryptovault.com>',
      to: email,
      subject: '❌ Transaction Rejected',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">Transaction Rejected</h2>
          <p>Your ${type} request has been rejected.</p>
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Type:</strong> ${type === 'deposit' ? 'Deposit' : 'Withdrawal'}</p>
            <p><strong>Amount:</strong> ${amount} ${asset}</p>
            <p><strong>Status:</strong> Rejected ❌</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          </div>
          <p>Please contact support if you believe this is an error.</p>
        </div>
      `
    })
  } catch (error) {
    console.error('Email sending error:', error)
  }
}
