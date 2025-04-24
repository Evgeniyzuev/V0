--1. Create a function to handle task completion and balance update in a transaction
CREATE OR REPLACE FUNCTION public.complete_task(
  p_user_id UUID,
  p_task_id BIGINT,
  p_reward_amount DECIMAL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Begin transaction
  BEGIN
    -- Update task status to completed
    UPDATE public.user_tasks
    SET
      status = 'completed'::task_status
    WHERE
      user_id = p_user_id
      AND task_id = p_task_id
      AND status IN ('assigned', 'in_progress');

    -- If no rows were updated, the task wasn't in the correct status
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Task not found or not in correct status';
    END IF;

    -- Update user's aicore_balance
    UPDATE public.users
    SET 
      aicore_balance = COALESCE(aicore_balance, 0) + p_reward_amount
    WHERE id = p_user_id;

    -- If no rows were updated, the user wasn't found
    IF NOT FOUND THEN
      RAISE EXCEPTION 'User not found';
    END IF;

    -- Log the operation
    PERFORM log_core_operation(
      p_user_id,
      p_reward_amount,
      'reinvest'
    );

  EXCEPTION
    WHEN OTHERS THEN
      -- Roll back the transaction on any error
      RAISE;
  END;
END;
$$; 