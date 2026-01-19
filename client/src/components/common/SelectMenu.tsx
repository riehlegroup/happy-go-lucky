import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { en as messages } from "@/messages";

export function SelectMenu() {
  return (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={messages.selectMenu.example.placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{messages.selectMenu.example.groupLabel}</SelectLabel>
          <SelectItem value="apple">
            {messages.selectMenu.example.items.apple}
          </SelectItem>
          <SelectItem value="banana">
            {messages.selectMenu.example.items.banana}
          </SelectItem>
          <SelectItem value="blueberry">
            {messages.selectMenu.example.items.blueberry}
          </SelectItem>
          <SelectItem value="grapes">
            {messages.selectMenu.example.items.grapes}
          </SelectItem>
          <SelectItem value="pineapple">
            {messages.selectMenu.example.items.pineapple}
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
