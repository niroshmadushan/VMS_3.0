'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'
import { Resend } from 'resend'
import type { FormData as FormDataType } from 'formdata-node'  // Use 'FormData' for native if on Node 18+

const resend = new Resend(process.env.RESEND_API_KEY!)

async function generatePassword(): Promise<string> {
  const password = crypto.randomBytes(8).toString('hex')
  console.log('Generated password:', password, typeof password) // Debug
  return password
}

async function sendCredentialsEmail(email: string, password: string): Promise<void> {
  try {
    const { data, error } = await resend.emails.send({
      from: 'noreply@vms.com',  // Verified sender
      to: [email],
      subject: 'Your VMS Account Credentials',
      html: `
        <h1>Welcome to VMS!</h1>
        <p>Your account has been created.</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${password}</p>
        <p>Please log in at <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/login">here</a> and change your password immediately.</p>
      `,
    })

    if (error) {
      console.error('Resend email error:', error)
      throw new Error(`Failed to send email: ${error.message}`)
    }
    console.log(`Email sent successfully: ${data?.id}`)
  } catch (error) {
    console.error('Error sending credentials email:', error)
    throw new Error('Failed to send credentials email')
  }
}

export async function manageUser(formData: FormDataType): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const id = formData.get('id') as string | null
    const fullName = formData.get('fullName') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const role = formData.get('role') as string
    const status = formData.get('status') === 'true'

    // Validate inputs
    if (!fullName || !email || !phone || !role) {
      return { success: false, error: 'Missing required fields' }
    }
    if (!['admin', 'reception', 'employee'].includes(role)) {
      return { success: false, error: 'Invalid role' }
    }

    if (!id) {
      // Create new user
      const password = await generatePassword()
      if (typeof password !== 'string') {
        console.error('Password is not a string:', password)
        return { success: false, error: 'Invalid password format' }
      }
      console.log('Creating user with payload:', { email, password, email_confirm: true, user_metadata: { full_name: fullName, phone, role, is_active: status } }) // Debug

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: password as string, // Explicit cast
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          phone,
          role,
          is_active: status,
        },
      })

      if (createError) {
        console.error('Create user error:', createError)
        return { success: false, error: createError.message }
      }

      if (!newUser?.user) {
        return { success: false, error: 'Failed to create user' }
      }

      // Upsert profile (trigger may handle, but explicit for safety)
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: newUser.user.id,
          full_name: fullName,
          email,
          phone,
          role,
          is_active: status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (profileError) {
        console.error('Profile upsert error:', profileError)
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id) // Cleanup
        return { success: false, error: profileError.message }
      }

      // Send email
      await sendCredentialsEmail(email, password)

      revalidatePath('/admin/users')
      return { success: true, message: `User created successfully! Login credentials sent to ${email}.` }
    } else {
      // Update existing user
      const { data: existingUser, error: getError } = await supabaseAdmin.auth.admin.getUserById(id)
      if (getError) {
        console.error('Get user error:', getError)
        return { success: false, error: getError.message }
      }

      if (!existingUser?.user) {
        return { success: false, error: 'User not found' }
      }

      // Update auth user
      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        email,
        user_metadata: {
          ...existingUser.user.user_metadata,
          full_name: fullName,
          phone,
          role,
          is_active: status,
        },
        email_confirm: true,
      })

      if (updateAuthError) {
        console.error('Update auth error:', updateAuthError)
        return { success: false, error: updateAuthError.message }
      }

      // Update profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          full_name: fullName,
          phone,
          role,
          is_active: status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (profileError) {
        console.error('Profile update error:', profileError)
        return { success: false, error: profileError.message }
      }

      revalidatePath('/admin/users')
      return { success: true, message: 'User updated successfully!' }
    }
  } catch (error) {
    console.error('Manage user error:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function resetUserPassword(formData: FormDataType): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const email = formData.get('email') as string
    const { error } = await supabaseAdmin.auth.admin.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/reset`,
      type: 'recovery',
    })

    if (error) {
      console.error('Reset password error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, message: `Password reset email sent to ${email}` }
  } catch (error) {
    console.error('Reset password error:', error)
    return { success: false, error: (error as Error).message }
  }
}