import {
  createServiceClient,
  createUserClient,
  jsonResponse,
  optionsResponse,
  requireActor,
} from '../_shared/ticket-evidence.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return optionsResponse();
  }

  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed.' }, { status: 405 });
  }

  try {
    const { authHeader, userId } = await requireActor(req);
    const url = new URL(req.url);
    const grantId = url.searchParams.get('grant')?.trim() ?? '';

    if (!grantId) {
      return jsonResponse({ error: 'Grant de download ausente.' }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    const userClient = createUserClient(authHeader);

    const { data: grant, error: grantError } = await serviceClient
      .from('ticket_attachment_download_grants')
      .select('id, attachment_id, granted_to_user_id, expires_at, resolved_at')
      .eq('id', grantId)
      .maybeSingle();

    if (grantError) {
      return jsonResponse({ error: 'Falha ao localizar o grant de download.' }, { status: 500 });
    }

    if (!grant) {
      return jsonResponse({ error: 'Grant de download não encontrado.' }, { status: 404 });
    }

    if (String(grant.granted_to_user_id) !== userId) {
      return jsonResponse({ error: 'Grant de download não pertence ao ator atual.' }, { status: 403 });
    }

    if (new Date(String(grant.expires_at)).getTime() <= Date.now()) {
      return jsonResponse({ error: 'Grant de download expirou.' }, { status: 410 });
    }

    const { data: supportVisibleAttachment, error: supportVisibleError } = await userClient
      .from('vw_support_ticket_attachments')
      .select('attachment_id')
      .eq('attachment_id', String(grant.attachment_id))
      .maybeSingle();

    if (supportVisibleError) {
      return jsonResponse({ error: 'Falha ao validar o acesso à evidência.' }, { status: 500 });
    }

    let visibleAttachment = supportVisibleAttachment;

    if (!visibleAttachment) {
      const { data: customerVisibleAttachment, error: customerVisibleError } = await userClient
        .from('vw_customer_portal_ticket_attachments')
        .select('attachment_id')
        .eq('attachment_id', String(grant.attachment_id))
        .maybeSingle();

      if (customerVisibleError) {
        return jsonResponse({ error: 'Falha ao validar o acesso à evidência.' }, { status: 500 });
      }

      visibleAttachment = customerVisibleAttachment;
    }

    if (!visibleAttachment) {
      return jsonResponse({ error: 'A evidência não está disponível para o ator atual.' }, { status: 403 });
    }

    const { data: attachment, error: attachmentError } = await serviceClient
      .from('ticket_attachments')
      .select('id, file_name, storage_bucket, storage_object_path, status, archived_at')
      .eq('id', String(grant.attachment_id))
      .maybeSingle();

    if (attachmentError) {
      return jsonResponse({ error: 'Falha ao localizar o objeto interno da evidência.' }, { status: 500 });
    }

    if (!attachment || attachment.archived_at || attachment.status !== 'available') {
      return jsonResponse({ error: 'A evidência não está mais disponível para download.' }, { status: 410 });
    }

    const { data: signed, error: signedError } = await serviceClient.storage
      .from(String(attachment.storage_bucket))
      .createSignedUrl(String(attachment.storage_object_path), 60, {
        download: String(attachment.file_name),
      });

    if (signedError || !signed?.signedUrl) {
      return jsonResponse({ error: 'Falha ao assinar a URL temporária da evidência.' }, { status: 500 });
    }

    await serviceClient
      .from('ticket_attachment_download_grants')
      .update({
        resolved_at: new Date().toISOString(),
      })
      .eq('id', grantId);

    return jsonResponse({
      attachmentId: String(attachment.id),
      signedUrl: signed.signedUrl,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Falha inesperada ao resolver download seguro.',
      },
      { status: 401 },
    );
  }
});
