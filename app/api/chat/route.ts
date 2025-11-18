import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://ai.sumopod.com/v1',
});

// Function to get data context based on user role
async function getDataContext(userId: string, userRole: string) {
  const supabase = await createClient();
  let context = '';

  try {
    // Get user info
    const { data: userProfile } = await supabase
      .from('users')
      .select('id, nama_lengkap, role, email')
      .eq('id', userId)
      .single();

    context += `User Information:\n`;
    context += `- Name: ${userProfile?.nama_lengkap || 'N/A'}\n`;
    context += `- Role: ${userProfile?.role || 'N/A'}\n`;
    context += `- Email: ${userProfile?.email || 'N/A'}\n\n`;

    // Get campaigns data
    let campaignsQuery = supabase
      .from('campaigns')
      .select(`
        id,
        target_revenue,
        master_campaigns:campaign_id(name, description),
        users:sales_id(nama_lengkap, email)
      `);

    if (userRole === 'Sales') {
      campaignsQuery = campaignsQuery.eq('sales_id', userId);
    } else if (userRole === 'GM') {
      const { data: teamSales } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'Sales')
        .eq('gm_id', userId);
      const teamIds = (teamSales || []).map(s => s.id);
      if (teamIds.length > 0) {
        campaignsQuery = campaignsQuery.in('sales_id', teamIds);
      } else {
        campaignsQuery = campaignsQuery.eq('sales_id', 'no-sales');
      }
    }
    // Admin sees all campaigns

    const { data: campaigns } = await campaignsQuery;

    context += `Campaigns Data:\n`;
    if (campaigns && campaigns.length > 0) {
      campaigns.forEach((camp: any, idx: number) => {
        context += `${idx + 1}. Campaign: ${(camp.master_campaigns as any)?.name || 'N/A'}\n`;
        context += `   Description: ${(camp.master_campaigns as any)?.description || 'N/A'}\n`;
        context += `   Target Revenue: Rp ${(camp.target_revenue || 0).toLocaleString('id-ID')}\n`;
        context += `   Sales: ${(camp.users as any)?.nama_lengkap || 'N/A'}\n`;
        context += `   Campaign ID: ${camp.id}\n\n`;
      });
    } else {
      context += `No campaigns found.\n\n`;
    }

    // Get campaign activities summary
    const campaignIds = (campaigns || []).map((c: any) => c.id);
    if (campaignIds.length > 0) {
      const { data: activities } = await supabase
        .from('campaign_activities')
        .select(`
          id,
          jenis_aktivitas,
          potential_value,
          tanggal_aktivitas,
          campaigns:campaign_id(master_campaigns:campaign_id(name)),
          master_customers:customer_id(name)
        `)
        .in('campaign_id', campaignIds)
        .order('tanggal_aktivitas', { ascending: false })
        .limit(50);

      context += `Recent Activities (last 50):\n`;
      if (activities && activities.length > 0) {
        activities.forEach((act: any, idx: number) => {
          context += `${idx + 1}. Activity: ${act.jenis_aktivitas}\n`;
          context += `   Date: ${act.tanggal_aktivitas || 'N/A'}\n`;
          context += `   Potential Value: ${act.potential_value ? `Rp ${Number(act.potential_value).toLocaleString('id-ID')}` : 'N/A'}\n`;
          context += `   Campaign: ${(act.campaigns as any)?.master_campaigns?.name || 'N/A'}\n`;
          context += `   Customer: ${(act.master_customers as any)?.name || 'N/A'}\n\n`;
        });
      } else {
        context += `No activities found.\n\n`;
      }

      // Get summary statistics
      const { data: closingActivities } = await supabase
        .from('campaign_activities')
        .select('potential_value')
        .in('campaign_id', campaignIds)
        .eq('jenis_aktivitas', 'Closing');

      const totalClosing = (closingActivities || []).reduce((sum: number, act: any) => {
        return sum + (Number(act.potential_value) || 0);
      }, 0);

      context += `Summary Statistics:\n`;
      context += `- Total Campaigns: ${campaigns?.length || 0}\n`;
      context += `- Total Closing Activities: ${closingActivities?.length || 0}\n`;
      context += `- Total Achievement Revenue: Rp ${totalClosing.toLocaleString('id-ID')}\n\n`;
    }

    // Get targets summary if available
    if (userRole === 'Admin' || userRole === 'GM') {
      let salesQuery = supabase
        .from('users')
        .select('id, nama_lengkap, email')
        .eq('role', 'Sales');

      if (userRole === 'GM') {
        salesQuery = salesQuery.eq('gm_id', userId);
      }

      const { data: salesUsers } = await salesQuery;
      context += `Sales Users:\n`;
      if (salesUsers && salesUsers.length > 0) {
        salesUsers.forEach((sales: any, idx: number) => {
          context += `${idx + 1}. ${sales.nama_lengkap} (${sales.email})\n`;
        });
      } else {
        context += `No sales users found.\n`;
      }
    }

  } catch (error: any) {
    console.error('Error fetching data context:', error);
    context += `\nError fetching some data: ${error.message}\n`;
  }

  return context;
}

export async function POST(request: NextRequest) {
  try {
    const { message, userId, userRole } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    // Get data context
    const dataContext = await getDataContext(userId, userRole);

    // Create system prompt
    const systemPrompt = `You are a helpful AI assistant for a Sales Activity Monitoring System. 
You help users understand their sales data, campaigns, activities, and performance metrics.

Available Data Context:
${dataContext}

Guidelines:
- Answer questions based on the provided data context
- If you don't have the information, say so politely
- Format numbers in Indonesian format (e.g., Rp 1.000.000)
- Be concise but helpful
- You can answer questions about:
  * Campaign details and descriptions
  * Activity summaries
  * Revenue metrics (Target, Potential, Achievement)
  * Sales performance
  * Recent activities
- Always respond in the same language as the user's question (Indonesian or English)
- If asked about data that's not in the context, politely explain that you need more information or suggest checking the dashboard directly.`;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}

