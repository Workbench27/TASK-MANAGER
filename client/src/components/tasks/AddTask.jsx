import { Dialog } from "@headlessui/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
} from "../../redux/slices/api/taskApiSlice";

import Button from "../Button";
import Loading from "../Loading";
import ModalWrapper from "../ModalWrapper";
import SelectList from "../SelectList";
import Textbox from "../Textbox";

const LISTS = ["todo", "in progress", "completed"];
const PRIORITIES = ["high", "medium", "normal", "low"];

const AddTask = ({ open, setOpen, task }) => {
  const defaultValues = {
    title: task?.title || "",
    dueDate: task?.dueDate ? task?.dueDate.substring(0, 10) : "",
    priority: task?.priority || "normal",
    stage: task?.stage || "todo",
    description: task?.description || "",
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues });

  const [priority, setPriority] = useState(task?.priority || "normal");
  const [stage, setStage] = useState(task?.stage || "todo");

  const [createTask, { isLoading }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();

  const handleOnSubmit = async (data) => {
    try {
      // Prepare the data for submission
      const newData = {
        title: data.title,
        dueDate: data.dueDate,
        priority,
        stage,
        description: data.description,
      };
  
      // Check if `task.id` is available before trying to update
      if (task?.id) {
        // Update the task if task.id is present
        const res = await updateTask({ ...newData, id: task.id }).unwrap();
        toast.success(res.message);
      } else {
        // If task.id is not present, it's a new task, so create it
        const res = await createTask(newData).unwrap();
        toast.success(res.message);
      }
  
      // Close the modal after the operation
      setTimeout(() => {
        setOpen(false);
      }, 500);
    } catch (err) {
      // Log and show an error message
      console.error(err);
      toast.error(err?.data?.message || err.error);
    }
  };
  
  

  return (
    <ModalWrapper open={open} setOpen={setOpen}>
      <form onSubmit={handleSubmit(handleOnSubmit)}>
        <Dialog.Title
          as="h2"
          className="text-base font-bold leading-6 text-gray-900 mb-4"
        >
          {task ? "Update Task" : "Add Task"}
        </Dialog.Title>

        <div className="mt-2 flex flex-col gap-6">
          <Textbox
            placeholder="Task Title"
            type="text"
            name="title"
            label="Task Title"
            className="w-full rounded"
            register={register("title", {
              required: "Title is required!",
            })}
            error={errors.title ? errors.title.message : ""}
          />

          <div className="flex gap-4">
            <SelectList
              label="Task Stage"
              lists={LISTS}
              selected={stage}
              setSelected={setStage}
            />
            <SelectList
              label="Priority Level"
              lists={PRIORITIES}
              selected={priority}
              setSelected={setPriority}
            />
          </div>

          <div className="w-full">
            <Textbox
              placeholder="Due Date"
              type="date"
              name="dueDate"
              label="Due Date"
              className="w-full rounded"
              register={register("dueDate", {
                required: "Due Date is required!",
              })}
              error={errors.dueDate ? errors.dueDate.message : ""}
            />
          </div>

          <div className="w-full">
            <p>Task Description</p>
            <textarea
              name="description"
              {...register("description", {
                required: "Description is required!",
              })}
              className="w-full bg-transparent px-3 py-1.5 2xl:py-3 border border-gray-300
                dark:border-gray-600 placeholder-gray-300 dark:placeholder-gray-700
                text-gray-900 dark:text-white outline-none text-base focus:ring-2
                ring-blue-300"
            ></textarea>
            {errors.description && (
              <p className="text-red-500 text-sm">{errors.description.message}</p>
            )}
          </div>

         
        </div>

        {(isLoading || isUpdating) ? (
          <div className="py-4">
            <Loading />
          </div>
        ) : (
          <div className="bg-gray-50 mt-6 mb-4 sm:flex sm:flex-row-reverse gap-4">
            <Button
              label="Submit"
              type="submit"
              className="bg-blue-600 px-8 text-sm font-semibold text-white hover:bg-blue-700  sm:w-auto"
            />
            <Button
              type="button"
              className="bg-white px-5 text-sm font-semibold text-gray-900 sm:w-auto"
              onClick={() => setOpen(false)}
              label="Cancel"
            />
          </div>
        )}
      </form>
    </ModalWrapper>
  );
};

export default AddTask;
