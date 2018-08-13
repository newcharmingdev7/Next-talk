import * as React from "react";
import { StatelessComponent } from "react";
import { Field, Form } from "react-final-form";
import { OnSubmit } from "talk-framework/lib/form";
import * as styles from "./SignIn.css";

import {
  composeValidators,
  required,
  validateEmail,
  validatePassword,
} from "talk-framework/lib/validation";

import {
  Button,
  Flex,
  FormField,
  InputLabel,
  TextField,
  Typography,
  ValidationMessage,
} from "talk-ui/components";

interface FormProps {
  email: string;
  password: string;
}

export interface SignInForm {
  onSubmit: OnSubmit<FormProps>;
}

const SignIn: StatelessComponent<SignInForm> = props => {
  return (
    <Form onSubmit={props.onSubmit}>
      {({ handleSubmit, submitting }) => (
        <form autoComplete="off" onSubmit={handleSubmit}>
          <Flex itemGutter direction="column" className={styles.root}>
            <Typography variant="heading1" align="center">
              Sign in to join the conversation
            </Typography>

            <Field
              name="email"
              validate={composeValidators(required, validateEmail)}
            >
              {({ input, meta }) => (
                <FormField>
                  <InputLabel>Email Address</InputLabel>
                  <TextField
                    name={input.name}
                    onChange={input.onChange}
                    value={input.value}
                    placeholder="Email Address"
                  />
                  {meta.touched &&
                    (meta.error || meta.submitError) && (
                      <ValidationMessage>
                        {meta.error || meta.submitError}
                      </ValidationMessage>
                    )}
                </FormField>
              )}
            </Field>

            <Field
              name="password"
              validate={composeValidators(required, validatePassword)}
            >
              {({ input, meta }) => (
                <FormField>
                  <InputLabel>Password</InputLabel>
                  <Typography variant="inputDescription">
                    Must be at least 8 characters
                  </Typography>
                  <TextField
                    name={input.name}
                    onChange={input.onChange}
                    value={input.value}
                    placeholder="Password"
                    type="password"
                  />
                  {meta.touched &&
                    (meta.error || meta.submitError) && (
                      <ValidationMessage>
                        {meta.error || meta.submitError}
                      </ValidationMessage>
                    )}
                  <span className={styles.forgotPassword}>
                    <Button variant="underlined" color="primary" size="small">
                      Forgot your password?
                    </Button>
                  </span>
                </FormField>
              )}
            </Field>

            <div className={styles.footer}>
              <Button
                variant="filled"
                color="primary"
                size="large"
                fullWidth
                type="submit"
              >
                Sign in and join the conversation
              </Button>
              <Flex
                itemGutter="half"
                justifyContent="center"
                className={styles.subFooter}
              >
                <Typography>Don't have an account?</Typography>
                <Button variant="underlined" size="small" color="primary">
                  Sign Up
                </Button>
              </Flex>
            </div>
          </Flex>
        </form>
      )}
    </Form>
  );
};

export default SignIn;
