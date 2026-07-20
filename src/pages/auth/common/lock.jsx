import React, { useState } from "react";
import Textinput from "@/components/ui/Textinput";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const schema = yup
  .object({
    email: yup.string().email("Invalid email").required("Email is Required"),
    mat_khau: yup.string().required("mat_khau is Required"),
  })
  .required();
const Lock = () => {
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 ">
      <Textinput
        name="email"
        label="email"
        type="mat_khau"
        register={register}
        error={errors.mat_khau}
        className="h-[48px]"
      />

      <button className="btn btn-dark block w-full text-center">Unlock</button>
    </form>
  );
};

export default Lock;
