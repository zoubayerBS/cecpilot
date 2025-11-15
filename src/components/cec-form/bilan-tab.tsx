"use client";

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { Observations } from "./observations";
import { BloodGas } from './blood-gas';
import { BalanceIO } from './balance-io';

interface BilanTabProps {
    isReadOnly: boolean;
}

export function BilanTab({ isReadOnly }: BilanTabProps) {
    const { control } = useFormContext();

    return (
        <fieldset disabled={isReadOnly} className="space-y-8 py-4">
            <BloodGas />
            <BalanceIO />
            <Observations />
        </fieldset>
    );
}
