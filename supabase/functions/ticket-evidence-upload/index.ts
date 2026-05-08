import {
  createServiceClient,
  createUserClient,
  getCorsHeaders,
  isAlreadyExistsStorageError,
  jsonResponse,
  optionsResponse,
  requireActor,
} from '../_shared/ticket-evidence.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return optionsResponse();
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, { status: 405 });
  }

  try {
    const { authHeader, userId } = await requireActor(req);
    const url = new URL(req.url);
    const intentId = url.searchParams.get('intent')?.trim() ?? '';

    if (!intentId) {
      return jsonResponse({ error: 'Intent de upload ausente.' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return jsonResponse({ error: 'Arquivo ausente no payload.' }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    const userClient = createUserClient(authHeader);

    const { data: intent, error: intentError } = await serviceClient
      .from('ticket_attachment_upload_intents')
      .select(
        'id, attachment_id, tenant_id, ticket_id, original_filename, content_type, size_bytes, storage_bucket, storage_object_path, created_by_user_id, expires_at, registered_at, failed_at',
      )
      .eq('id', intentId)
      .maybeSingle();

    if (intentError) {
      return jsonResponse(
        { error: 'Falha ao localizar a intenção de upload.' },
        { status: 500 },
      );
    }

    if (!intent) {
      return jsonResponse({ error: 'Intenção de upload não encontrada.' }, { status: 404 });
    }

    if (String(intent.created_by_user_id) !== userId) {
      return jsonResponse({ error: 'Intenção de upload não pertence ao ator atual.' }, { status: 403 });
    }

    if (intent.registered_at) {
      return jsonResponse({ error: 'Esta intenção de upload já foi finalizada.' }, { status: 409 });
    }

    if (intent.failed_at) {
      return jsonResponse({ error: 'Esta intenção de upload já foi invalidada.' }, { status: 409 });
    }

    if (new Date(String(intent.expires_at)).getTime() <= Date.now()) {
      return jsonResponse({ error: 'A intenção de upload expirou.' }, { status: 410 });
    }

    if ((file.type || '').toLowerCase() !== String(intent.content_type)) {
      return jsonResponse(
        { error: 'O tipo do arquivo não corresponde ao contrato preparado para este upload.' },
        { status: 400 },
      );
    }

    if (file.size !== Number(intent.size_bytes)) {
      return jsonResponse(
        { error: 'O tamanho do arquivo não corresponde ao contrato preparado para este upload.' },
        { status: 400 },
      );
    }

    const { error: uploadError } = await serviceClient.storage
      .from(String(intent.storage_bucket))
      .upload(String(intent.storage_object_path), file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError && !isAlreadyExistsStorageError(uploadError)) {
      await serviceClient
        .from('ticket_attachment_upload_intents')
        .update({
          failed_at: new Date().toISOString(),
          failure_reason: String(uploadError.message ?? 'upload_failed').slice(0, 240),
        })
        .eq('id', intentId);

      return jsonResponse(
        { error: 'Falha ao enviar a evidência para o storage governado.' },
        { status: 500 },
      );
    }

    const { data: registeredRows, error: registerError } = await userClient.rpc(
      'rpc_support_register_ticket_attachment',
      {
        p_upload_intent_id: intentId,
      },
    );

    if (registerError) {
      await serviceClient.storage
        .from(String(intent.storage_bucket))
        .remove([String(intent.storage_object_path)]);

      await serviceClient
        .from('ticket_attachment_upload_intents')
        .update({
          failed_at: new Date().toISOString(),
          failure_reason: String(registerError.message ?? 'register_failed').slice(0, 240),
        })
        .eq('id', intentId);

      return jsonResponse(
        { error: 'Falha ao registrar a evidência após o upload.' },
        { status: 500 },
      );
    }

    const attachment = Array.isArray(registeredRows) ? registeredRows[0] : registeredRows;

    return jsonResponse(
      {
        attachment,
      },
      {
        status: 200,
        headers: getCorsHeaders(),
      },
    );
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Falha inesperada ao processar upload.',
      },
      { status: 401 },
    );
  }
});
