import clsx from "clsx";
import moment from "moment";
import React, { useState, useEffect } from "react";
import { FaBug, FaSpinner, FaTasks, FaThumbsUp, FaUser } from "react-icons/fa";
import { GrInProgress } from "react-icons/gr";
import {
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdKeyboardDoubleArrowUp,
  MdOutlineDoneAll,
  MdOutlineMessage,
  MdTaskAlt,
} from "react-icons/md";
import { RxActivityLog } from "react-icons/rx";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button, Loading, Tabs } from "../components";
import { TaskColor } from "../components/tasks";
import {
  useGetSingleTaskQuery,
  usePostTaskActivityMutation,
  useGetTaskActivitiesQuery,
} from "../redux/slices/api/taskApiSlice";
import {
  PRIOTITYSTYELS,
  TASK_TYPE,
  getInitials,
} from "../utils";

const ICONS = {
  high: <MdKeyboardDoubleArrowUp />,
  medium: <MdKeyboardArrowUp />,
  low: <MdKeyboardArrowDown />,
};

const bgColor = {
  high: "bg-red-200",
  medium: "bg-yellow-200",
  low: "bg-blue-200",
};

const TABS = [
  { title: "Task Detail", icon: <FaTasks /> },
  { title: "Activities/Timeline", icon: <RxActivityLog /> },
];

const TASKTYPEICON = {
  commented: (
    <div className='w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white'>
      <MdOutlineMessage />
    </div>
  ),
  started: (
    <div className='w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white'>
      <FaThumbsUp size={20} />
    </div>
  ),
  assigned: (
    <div className='w-6 h-6 flex items-center justify-center rounded-full bg-gray-500 text-white'>
      <FaUser size={14} />
    </div>
  ),
  bug: (
    <div className='text-red-600'>
      <FaBug size={24} />
    </div>
  ),
  completed: (
    <div className='w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white'>
      <MdOutlineDoneAll size={24} />
    </div>
  ),
  "in progress": (
    <div className='w-8 h-8 flex items-center justify-center rounded-full bg-violet-600 text-white'>
      <GrInProgress size={16} />
    </div>
  ),
};

const act_types = [
  "Started",
  "Completed",
  "In Progress",
  "Commented",
  "Bug",
  "Assigned",
];

const Activities = ({ task, id, refetch }) => {
  const [selected, setSelected] = useState("Started");
  const [text, setText] = useState("");

  const [postActivity, { isLoading }] = usePostTaskActivityMutation();
  const { data: activity = [], refetch: refetchActivities } = useGetTaskActivitiesQuery({ id });

  useEffect(() => {
    console.log("Received task in Activities:", task);
  }, [task]);

  const handleSubmit = async () => {
    try {
      const data = {
        type: selected?.toLowerCase(),
        activity: text,
      };
      const res = await postActivity({ data, id }).unwrap();
      setText("");
      toast.success(res?.message);
      refetchActivities(); // if using the query's own refetch
    } catch (err) {
      console.log(err);
      toast.error(err?.data?.message || err.error);
    }
  };

  const Card = ({ item }) => (
    <div className='flex space-x-4'>
      <div className='flex flex-col items-center flex-shrink-0'>
        <div className='w-10 h-10 flex items-center justify-center'>
          {TASKTYPEICON[item?.type]}
        </div>
        <div className='h-full flex items-center'>
          <div className='w-0.5 bg-gray-300 h-full'></div>
        </div>
      </div>
      <div className='flex flex-col gap-y-1 mb-8'>
        <p className='font-semibold'>{item?.by?.name}</p>
        <div className='text-gray-500 space-x-2'>
          <span className='capitalize'>{item?.type}</span>
          <span className='text-sm'>
          {item?.createdAt
  ? moment(new Date(item.createdAt)).format("MMM D, YYYY")
  : "No date"}

          </span>
        </div>
        <div className='text-gray-700'>{item?.activity}</div>
      </div>
    </div>
  );

  return (
    <div className='w-full flex gap-10 2xl:gap-20 min-h-screen px-10 py-8 bg-white shadow rounded-md justify-between overflow-y-auto'>
      <div className='w-full md:w-1/2'>
        <h4 className='text-gray-600 font-semibold text-lg mb-5'>Activities</h4>
        <div className='w-full space-y-0'>
          {activity.length > 0 ? (
            activity.map((item, index) => (
              <Card
                key={item.id || index}
                item={item}
              />
            ))
          ) : (
            <p className='text-gray-500'>No activities yet.</p>
          )}
        </div>
      </div>
      <div className='w-full md:w-1/3'>
        <h4 className='text-gray-600 font-semibold text-lg mb-5'>Add Activity</h4>
        <div className='w-full flex flex-wrap gap-5'>
          {act_types.map((item) => (
            <label key={item} className='flex gap-2 items-center'>
              <input
                type='radio'
                className='w-4 h-4'
                checked={selected === item}
                onChange={() => setSelected(item)}
              />
              <span>{item}</span>
            </label>
          ))}
          <textarea
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='Describe activity...'
            className='bg-white w-full mt-4 border border-gray-300 outline-none p-3 rounded-md focus:ring-2 ring-blue-500'
          />
          {isLoading ? (
            <Loading />
          ) : (
            <Button
              type='button'
              label='Submit'
              onClick={handleSubmit}
              className='bg-blue-600 text-white rounded mt-4'
            />
          )}
        </div>
      </div>
    </div>
  );
};

const TaskDetail = () => {
  const { id } = useParams();
  const { data, isLoading, refetch } = useGetSingleTaskQuery({ id });
  const [selectedTab, setSelectedTab] = useState(0);

  const task = data?.task || {};

  if (isLoading) {
    return (
      <div className='py-10'>
        <Loading />
      </div>
    );
  }

  return (
    <div className='w-full flex flex-col gap-4 mb-4 overflow-y-hidden'>
      <h1 className='text-2xl text-gray-600 font-bold'>{task.title}</h1>
      <Tabs tabs={TABS} selected={selectedTab} setSelected={setSelectedTab}>
        {selectedTab === 0 ? (
          <div className='w-full flex flex-col md:flex-row gap-5 2xl:gap-8 bg-white shadow rounded-md px-8 py-8 overflow-y-auto'>
            <div className='w-full md:w-1/2 space-y-8'>
              <div className='flex items-center gap-5'>
                <div
                  className={clsx(
                    "flex gap-1 items-center text-base font-semibold px-3 py-1 rounded-full",
                    PRIOTITYSTYELS[task.priority],
                    bgColor[task.priority]
                  )}
                >
                  <span className='text-lg'>{ICONS[task.priority]}</span>
                  <span className='uppercase'>{task.priority} Priority</span>
                </div>
                <div className='flex items-center gap-2'>
                  <TaskColor className={TASK_TYPE[task.stage]} />
                  <span className='text-black uppercase'>{task.stage}</span>
                </div>
              </div>
            </div>
            <div className='w-full md:w-1/2 space-y-3'>
              {task.description && (
                <>
                  <p className='text-lg font-semibold'>TASK DESCRIPTION</p>
                  <div className='w-full'>{task.description}</div>
                </>
              )}
            </div>
          </div>
        ) : (
          <Activities task={task} refetch={refetch} id={id} />
        )}
      </Tabs>
    </div>
  );
};

export default TaskDetail;
