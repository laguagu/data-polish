import { useRef } from "react";
import { useDrop } from "react-dnd";
import { NativeTypes } from "react-dnd-html5-backend";

interface FileTargetProps {
  onDrop: (file: File) => void;
  children: React.ReactNode;
}

export const FileTarget: React.FC<FileTargetProps> = ({ onDrop, children }) => {
  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    accept: [NativeTypes.FILE],
    drop(item: { files: File[] }) {
      if (item.files && item.files.length) {
        onDrop(item.files[0]);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const ref = useRef<HTMLDivElement>(null);

  drop(ref);

  const isActive = canDrop && isOver;

  return (
    <div
      ref={ref}
      className={`${isActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"}`}
    >
      {children}
    </div>
  );
};
