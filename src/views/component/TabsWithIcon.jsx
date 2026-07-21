import React, { Fragment } from "react";
import { Tab } from "@headlessui/react";
import Icon from "@/components/ui/Icon";

const DEFAULT_PANEL_CLASS =
  "text-slate-600 dark:text-slate-400 text-sm font-normal";

const TabsWithIcon = ({
  items = [],
  tabListClassName = "lg:space-x-8 md:space-x-4 space-x-0 rtl:space-x-reverse",
  panelClassName = DEFAULT_PANEL_CLASS,
}) => {
  return (
    <Tab.Group>
      <Tab.List className={tabListClassName}>
        {items.map((item, index) => (
          <Tab
            as={Fragment}
            key={item?.key || `${item?.title || "tab"}-${index}`}>
            {({ selected }) => (
              <button
                className={` inline-flex items-start text-sm font-medium mb-7 capitalize bg-white dark:bg-slate-800 ring-0 foucs:ring-0 focus:outline-none px-2 transition duration-150 before:transition-all before:duration-150 relative before:absolute
                     before:left-1/2 before:bottom-[-6px] before:h-[1.5px]
                      before:bg-primary-500 before:-translate-x-1/2
              ${
                selected
                  ? "text-primary-500 before:w-full"
                  : "text-slate-500 before:w-0 dark:text-slate-300"
              }
              `}>
                <span className="text-base relative top-[1px] ltr:mr-1 rtl:ml-1">
                  <Icon icon={item?.icon} />
                </span>
                {item?.title}
              </button>
            )}
          </Tab>
        ))}
      </Tab.List>

      <Tab.Panels>
        {items.map((item, index) => (
          <Tab.Panel
            key={
              item?.panelKey ||
              item?.key ||
              `${item?.title || "panel"}-${index}`
            }>
            <div className={panelClassName}>{item?.content}</div>
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
};

export default TabsWithIcon;
