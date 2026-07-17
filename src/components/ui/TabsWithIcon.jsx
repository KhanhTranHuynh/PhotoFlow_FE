import React, { Fragment } from "react";
import { Tab } from "@headlessui/react";
import Icon from "@/components/ui/Icon";

const TabsWithIcon = ({
  items = [],
  tabListClassName = "flex border-b border-slate-200 dark:border-slate-700 space-x-6 mb-6",
  panelClassName = "pt-4 text-slate-600 dark:text-slate-400 text-sm",
}) => {
  return (
    <Tab.Group>
      <Tab.List className={tabListClassName}>
        {items.map((item, index) => (
          <Tab as={Fragment} key={item?.key || index}>
            {({ selected }) => (
              <button
                className={`relative flex items-center gap-1 pb-2 text-sm font-medium transition-all
                  ${
                    selected
                      ? "text-primary-500"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                  }
                `}>
                {/* Icon */}
                <Icon icon={item?.icon} className="text-base" />

                {/* Text */}
                <span>{item?.title}</span>

                {/* Underline */}
                <span
                  className={`absolute left-0 -bottom-[1px] h-[2px] bg-primary-500 transition-all
                    ${selected ? "w-full" : "w-0"}
                  `}
                />
              </button>
            )}
          </Tab>
        ))}
      </Tab.List>

      <Tab.Panels>
        {items.map((item, index) => (
          <Tab.Panel key={item?.key || index}>
            <div className={panelClassName}>{item?.content}</div>
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
};

export default TabsWithIcon;
