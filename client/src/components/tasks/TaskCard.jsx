import clsx from "clsx";
import React, { useState } from "react";
import { IoMdAdd } from "react-icons/io";
import {
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdKeyboardDoubleArrowUp,
} from "react-icons/md";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

import {
  BGS,
  PRIOTITYSTYELS,
  TASK_TYPE,
  formatDate,
} from "../../utils/index.js";
import UserInfo from "../UserInfo.jsx";
import { TaskColor, TaskDialog } from "./index";

const ICONS = {
  high: <MdKeyboardDoubleArrowUp />,
  medium: <MdKeyboardArrowUp />,
  low: <MdKeyboardArrowDown />,
};

const TaskCard = ({ task }) => {
  const { user } = useSelector((state) => state.auth);
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className='w-full h-fit bg-white dark:bg-[#1f1f1f] shadow-md p-4 rounded'>
        <div className='w-full flex justify-between'>
          <div
            className={clsx(
              "flex flex-1 gap-1 items-center text-sm font-medium",
              PRIOTITYSTYELS[task?.priority]
            )}
          >
            <span className='text-lg'>{ICONS[task?.priority]}</span>
            <span className='uppercase'>{task?.priority} Priority</span>
          </div>
          <TaskDialog task={task} />
        </div>
        <>
          <Link to={`/task/${task.id}`}>
            <div className='flex items-center gap-2'>
              <TaskColor className={TASK_TYPE[task.stage]} />
              <h4 className='text- line-clamp-1 text-black dark:text-white'>
                {task?.title}
              </h4>
            </div>
          </Link>
          <span className='text-sm text-gray-600 dark:text-gray-400'>
            {formatDate(new Date(task?.dueDate))}
          </span>
        </>

        <div className='w-full border-t border-gray-200 dark:border-gray-700 my-2' />
      </div>
    </>
  );
};

export default TaskCard;
