"use client";
import { createFeedback } from "@/app/lib/order/action";
import {
  Button,
  ButtonGroup,
  Card,
  Spinner,
  Textarea,
} from "@nextui-org/react";
import React, { useState } from "react";
import { FaStar } from "react-icons/fa";
import { toast } from "react-toastify";

interface Props {
  receiptCode: string;
}

function Feedback({ receiptCode }: Props) {
  const [rating, setRating] = useState(0);
  const [posting, setPosting] = useState(false);

  const handleRating = (rate: number) => {
    setRating(rate);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPosting(true);
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    formData.set("receiptCode", receiptCode);
    formData.set("rate", String(rating));
    const isValid = rating && receiptCode;
    if (!isValid) {
      setPosting(false);
      return toast.success("Missing required field!");
    }
    const { isSuccess, message } = await createFeedback(formData);
    setPosting(false);
    if (isSuccess) {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  return (
    <Card className="mx-1 mt-4 p-1">
      <div className="flex justify-center items-center">
        <span className="mr-2">Rating:</span>
        <ButtonGroup variant="light" size="lg">
          {[1, 2, 3, 4, 5].map((rate) => (
            <Button key={rate} isIconOnly onClick={() => handleRating(rate)}>
              <FaStar
                size={24}
                className={`cursor-pointer ${
                  rating >= rate ? "text-primary" : "text-gray-300"
                }`}
              />
            </Button>
          ))}
        </ButtonGroup>
      </div>
      <div className="mt-4 mx-1">
        <form onSubmit={handleSubmit}>
          <Textarea
            variant="faded"
            name="feedback"
            label="Feedback"
            placeholder="Enter your feedback! We appreciate your support ❤️"
            color="primary"
          />
          <Button
            className="mt-2"
            color="primary"
            type="submit"
            fullWidth
            isDisabled={posting}
          >
            {posting ? <Spinner color="white" /> : "Submit"}
          </Button>
        </form>
      </div>
    </Card>
  );
}

export default Feedback;
