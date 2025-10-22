// Email notification utility for admin approval system
// This would typically integrate with email services like SendGrid, Nodemailer, etc.

interface EmailNotification {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

interface AdminApprovalEmailData {
  adminName: string;
  adminEmail: string;
  status: 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

interface NewAdminRequestEmailData {
  adminName: string;
  adminEmail: string;
  adminDepartment: string;
  adminPhone: string;
  registeredAt: string;
}

// Email templates
const emailTemplates = {
  adminApproved: (data: AdminApprovalEmailData) => ({
    subject: "🎉 Your Admin Account Has Been Approved!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Account Approved!</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb; border-radius: 10px; margin-top: 20px;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Hello ${data.adminName}!</h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Great news! Your admin account has been <strong style="color: #10b981;">approved</strong> by the Super Admin.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
            <p style="margin: 0; color: #374151;"><strong>Account Details:</strong></p>
            <ul style="color: #6b7280; margin: 10px 0;">
              <li><strong>Email:</strong> ${data.adminEmail}</li>
              <li><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">Approved</span></li>
              <li><strong>Approved By:</strong> ${data.approvedBy || 'Super Admin'}</li>
              <li><strong>Approved At:</strong> ${data.approvedAt || new Date().toLocaleString()}</li>
            </ul>
          </div>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            You can now log in to the admin panel and access all admin features including:
          </p>
          
          <ul style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            <li>📊 Dashboard and Analytics</li>
            <li>📦 Product Management</li>
            <li>📋 Order Management</li>
            <li>💬 Customer Chat Support</li>
            <li>👥 User Management</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/user/login" 
               style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              🚀 Login to Admin Panel
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
          <p>If you have any questions, please contact your administrator.</p>
          <p>© 2024 SHOEMART Admin Panel. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  adminRejected: (data: AdminApprovalEmailData) => ({
    subject: "❌ Admin Account Request Status Update",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">❌ Account Request Update</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb; border-radius: 10px; margin-top: 20px;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Hello ${data.adminName}!</h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            We regret to inform you that your admin account request has been <strong style="color: #ef4444;">rejected</strong>.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
            <p style="margin: 0; color: #374151;"><strong>Account Details:</strong></p>
            <ul style="color: #6b7280; margin: 10px 0;">
              <li><strong>Email:</strong> ${data.adminEmail}</li>
              <li><strong>Status:</strong> <span style="color: #ef4444; font-weight: bold;">Rejected</span></li>
              <li><strong>Rejected By:</strong> ${data.approvedBy || 'Super Admin'}</li>
              <li><strong>Rejected At:</strong> ${data.approvedAt || new Date().toLocaleString()}</li>
              ${data.rejectionReason ? `<li><strong>Reason:</strong> ${data.rejectionReason}</li>` : ''}
            </ul>
          </div>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            If you believe this is an error or would like to reapply, please contact your administrator for more information.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin-register" 
               style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              🔄 Reapply for Admin Access
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
          <p>Thank you for your interest in joining the admin team.</p>
          <p>© 2024 SHOEMART Admin Panel. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  newAdminRequest: (data: NewAdminRequestEmailData) => ({
    subject: "🔔 New Admin Registration Request - Action Required",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔔 New Admin Request</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb; border-radius: 10px; margin-top: 20px;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Super Admin Action Required</h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            A new admin registration request requires your review and approval.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <p style="margin: 0; color: #374151; font-weight: bold; margin-bottom: 15px;">New Admin Details:</p>
            <ul style="color: #6b7280; margin: 0; list-style: none; padding: 0;">
              <li style="margin-bottom: 8px;"><strong>Name:</strong> ${data.adminName}</li>
              <li style="margin-bottom: 8px;"><strong>Email:</strong> ${data.adminEmail}</li>
              <li style="margin-bottom: 8px;"><strong>Department:</strong> ${data.adminDepartment}</li>
              <li style="margin-bottom: 8px;"><strong>Phone:</strong> ${data.adminPhone}</li>
              <li style="margin-bottom: 8px;"><strong>Registered:</strong> ${data.registeredAt}</li>
              <li><strong>Status:</strong> <span style="color: #f59e0b; font-weight: bold;">Pending Approval</span></li>
            </ul>
          </div>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Please review this request and take appropriate action in the Super Admin dashboard.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/super-admin/dashboard" 
               style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              🔧 Review Admin Request
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
          <p>This is an automated notification from the SHOEMART Admin Panel.</p>
          <p>© 2024 SHOEMART Admin Panel. All rights reserved.</p>
        </div>
      </div>
    `
  })
};

// Email sending function (placeholder - would integrate with actual email service)
export async function sendEmailNotification(notification: EmailNotification): Promise<boolean> {
  try {
    console.log('📧 Email notification would be sent:', {
      to: notification.to,
      subject: notification.subject,
      template: notification.template
    });

    // In a real implementation, this would:
    // 1. Connect to email service (SendGrid, Nodemailer, etc.)
    // 2. Send the email with the template
    // 3. Handle errors and retries
    // 4. Log email delivery status
    
    // For now, we'll simulate a successful send
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✅ Email sent successfully to:', notification.to);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
}

// Admin approval notification functions
export async function notifyAdminApproval(adminData: AdminApprovalEmailData): Promise<boolean> {
  const template = adminData.status === 'approved' 
    ? emailTemplates.adminApproved(adminData)
    : emailTemplates.adminRejected(adminData);

  return await sendEmailNotification({
    to: adminData.adminEmail,
    subject: template.subject,
    template: adminData.status,
    data: adminData
  });
}

export async function notifyNewAdminRequest(adminData: NewAdminRequestEmailData, superAdminEmail: string): Promise<boolean> {
  const template = emailTemplates.newAdminRequest(adminData);

  return await sendEmailNotification({
    to: superAdminEmail,
    subject: template.subject,
    template: 'new_admin_request',
    data: adminData
  });
}

// Batch notification functions
export async function notifyMultipleAdmins(adminDataList: AdminApprovalEmailData[]): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const adminData of adminDataList) {
    try {
      const result = await notifyAdminApproval(adminData);
      if (result) {
        success++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error('Failed to notify admin:', adminData.adminEmail, error);
      failed++;
    }
  }

  return { success, failed };
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Email template preview (for testing)
export function getEmailPreview(template: string, data: any): string {
  switch (template) {
    case 'adminApproved':
      return emailTemplates.adminApproved(data).html;
    case 'adminRejected':
      return emailTemplates.adminRejected(data).html;
    case 'newAdminRequest':
      return emailTemplates.newAdminRequest(data).html;
    default:
      return '<p>Template not found</p>';
  }
}
