import React from "react";
import { useDispatch } from "react-redux";
import { setOpenSidebar } from "../redux/slices/authSlice";
import UserAvatar from "./UserAvatar";

const Navbar = () => {
  const dispatch = useDispatch();

  return (
    <div className='flex justify-between items-center bg-white dark:bg-[#1f1f1f] px-4 py-3 2xl:py-4 sticky z-10 top-0'>
      <div className='flex gap-4'>
        <div className=''>
          <button
            onClick={() => dispatch(setOpenSidebar(true))}
            className='text-2xl text-gray-500 block md:hidden'
          >
            ☰
          </button>
        </div>
      </div>

      <div className='flex gap-2 items-center'>
        <UserAvatar />
      </div>
    </div>
  );
};

export default Navbar;
