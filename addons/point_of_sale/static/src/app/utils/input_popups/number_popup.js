/** @odoo-module */

import { _t } from "@web/core/l10n/translation";
import { useService } from "@web/core/utils/hooks";
import { useState, useRef, onMounted, Component } from "@odoo/owl";
import { Dialog } from "@web/core/dialog/dialog";
import { Numpad } from "@point_of_sale/app/generic_components/numpad/numpad";

export class NumberPopup extends Component {
    static template = "point_of_sale.NumberPopup";
    static components = { Numpad, Dialog };
    static props = {
        title: { type: String, optional: true },
        startingValue: { type: Number, optional: true },
        isInputSelected: Boolean,
        nbrDecimal: { type: Number, optional: true },
        inputSuffix: { type: String, optional: true },
        cheap: { type: Boolean, optional: true },
        isPassword: { type: Boolean, optional: true },
        getInputBufferReminder: { type: Function, optional: true },
        getPayload: Function,
        close: Function,
    };
    static defaultProps = {
        title: _t("Confirm?"),
        cheap: false,
        startingValue: null,
        isPassword: false,
        nbrDecimal: 0,
        inputSuffix: "",
        getInputBufferReminder: () => false,
    };

    /**
     * @param {Object} props
     * @param {Boolean} props.isPassword Show password popup.
     * @param {number|null} props.startingValue Starting value of the popup.
     * @param {Boolean} props.isInputSelected Input is highlighted and will reset upon a change.
     */
    setup() {
        this.ui = useState(useService("ui"));
        let startingBuffer = "";
        let startingPayload = null;
        if (typeof this.props.startingValue === "number" && this.props.startingValue > 0) {
            startingBuffer = this.props.startingValue
                .toFixed(this.props.nbrDecimal)
                .toString()
                .replace(".", this.decimalSeparator);
            startingPayload = this.props.startingValue.toFixed(this.props.nbrDecimal);
        }
        this.state = useState({
            buffer: startingBuffer,
            toStartOver: this.props.isInputSelected,
            payload: startingPayload,
        });
        this.numberBuffer = useService("number_buffer");
        this.numberBuffer.use({
            triggerAtEnter: () => this.confirm(),
            triggerAtEscape: () => this.cancel(),
            state: this.state,
        });
        this.inputRef = useRef("input");
        onMounted(this.onMounted);
    }
    onMounted() {
        if (this.inputRef.el) {
            this.inputRef.el.focus();
        }
    }
    get decimalSeparator() {
        return this.env.services.localization.decimalPoint;
    }
    getNumpadButtons() {
        const { isPassword, cheap } = this.props;
        return [
            { value: "1" },
            { value: "2" },
            { value: "3" },
            ...(!isPassword ? [{ value: cheap ? "+1" : "+10" }] : []),
            { value: "4" },
            { value: "5" },
            { value: "6" },
            ...(!isPassword ? [{ value: cheap ? "+2" : "+20" }] : []),
            { value: "7" },
            { value: "8" },
            { value: "9" },
            ...(!isPassword ? [{ value: "-" }] : []),
            { value: "Delete", text: "C" },
            { value: "0" },
            ...(!isPassword ? [{ value: this.decimalSeparator }] : []),
            { value: "Backspace", text: "⌫" },
        ];
    }
    get inputBuffer() {
        if (this.state.buffer === null) {
            return "";
        }
        if (this.props.isPassword) {
            return this.state.buffer.replace(/./g, "•");
        } else {
            return this.state.buffer;
        }
    }
    confirm() {
        this.props.getPayload(this.computePayload());
        this.props.close();
    }
    computePayload() {
        let startingPayload = null;
        if (typeof this.props.startingValue === "number" && this.props.startingValue > 0) {
            startingPayload = this.props.startingValue.toFixed(this.props.nbrDecimal);
        }
        if (this.state.payload != startingPayload) {
            return this.state.payload;
        }
        return this.numberBuffer.get();
    }
}
