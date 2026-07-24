alter type public.engineering_work_item_status add value if not exists 'returned_to_support';

alter type public.ticket_event_type add value if not exists 'engineering_update_added';
alter type public.ticket_event_type add value if not exists 'engineering_status_updated';
alter type public.ticket_event_type add value if not exists 'engineering_returned_to_support';
