import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { msgKey, translate } from "@/Resources/i18n";

export function SelectMenu() {
  return (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue
          placeholder={translate(msgKey.components.selectMenu.placeholder)}
        />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{translate(msgKey.components.selectMenu.label)}</SelectLabel>
          <SelectItem value="apple">
            {translate(msgKey.components.selectMenu.items.apple)}
          </SelectItem>
          <SelectItem value="banana">
            {translate(msgKey.components.selectMenu.items.banana)}
          </SelectItem>
          <SelectItem value="blueberry">
            {translate(msgKey.components.selectMenu.items.blueberry)}
          </SelectItem>
          <SelectItem value="grapes">
            {translate(msgKey.components.selectMenu.items.grapes)}
          </SelectItem>
          <SelectItem value="pineapple">
            {translate(msgKey.components.selectMenu.items.pineapple)}
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
