/**
 * @Author: Gongxh
 * @Date: 2025-02-14
 * @Description: 满足所有条件显示
 */
import { GObject } from "fairygui-cc";
import { ConditionMode } from "../ConditionMode";
import { ConditionFGUINode } from "./ConditionFGUINode";
export class ConditionAllNode extends ConditionFGUINode {
    /**
     * 构建红点节点
     * @param {GObject} node 关联节点
     * @param {...number[]} conditionTypes 条件类型
     */
    public constructor(node: GObject, ...conditionTypes: number[]) {
        super(node, ConditionMode.All, ...conditionTypes);
    }
}