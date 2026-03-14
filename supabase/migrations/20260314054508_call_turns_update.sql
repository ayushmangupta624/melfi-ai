alter table public.call_turns 
  add constraint call_turns_call_id_turn_index_unique 
  unique (call_id, turn_index);
