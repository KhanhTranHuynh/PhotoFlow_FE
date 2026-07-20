import React from "react";
import Textinput from "@/components/ui/Textinput";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const FormValidationSchema = yup
  .object({
    mat_khau: yup.string().required("mat_khau is Required"),
    email: yup.string().email("Invalid email").required("Email is Required"),
    so_dien_thoai: yup.string().required("so_dien_thoai is Required"),
    confirmmat_khau: yup
      .string()
      .required()
      .oneOf([yup.ref("mat_khau")]),
  })
  .required();

const MultiValidation = () => {
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm({
    resolver: yupResolver(FormValidationSchema),
  });

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="lg:grid-cols-2 grid gap-5 grid-cols-1 ">
        <Textinput
          name="email"
          label="email"
          type="email"
          register={register}
          error={errors.email}
        />
        <Textinput
          name="mat_khau"
          label="mat_khau"
          type="mat_khau"
          register={register}
          error={errors.mat_khau}
        />
        <Textinput
          name="so_dien_thoai"
          label="so_dien_thoai"
          type="text"
          register={register}
          error={errors.so_dien_thoai}
        />
        <Textinput
          name="confirmmat_khau"
          label="confirmmat_khau"
          type="mat_khau"
          register={register}
          error={errors.confirmmat_khau}
        />

        <div className="lg:col-span-2 col-span-1">
          <div className="ltr:text-right rtl:text-left">
            <button className="btn btn-dark  text-center">Submit</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MultiValidation;
